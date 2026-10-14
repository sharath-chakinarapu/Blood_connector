package com.bloodconnector.api.api;

import java.time.Clock;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.bloodconnector.api.domain.BloodRequest;
import com.bloodconnector.api.domain.BloodRequestStatus;
import com.bloodconnector.api.domain.Chat;
import com.bloodconnector.api.domain.ChatMessage;
import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;
import com.bloodconnector.api.repository.BloodRequestRepository;
import com.bloodconnector.api.repository.ChatMessageRepository;
import com.bloodconnector.api.repository.ChatRepository;
import com.bloodconnector.api.repository.UnreadCountProjection;
import com.bloodconnector.api.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {

    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final ChatMessageRepository messageRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final DonorMatchingService donorMatchingService;
    private final Clock clock;

    public ChatService(
            UserRepository userRepository,
            ChatRepository chatRepository,
            ChatMessageRepository messageRepository,
            BloodRequestRepository bloodRequestRepository,
            DonorMatchingService donorMatchingService,
            Clock clock) {
        this.userRepository = userRepository;
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
        this.bloodRequestRepository = bloodRequestRepository;
        this.donorMatchingService = donorMatchingService;
        this.clock = clock;
    }

    @Transactional
    public ConversationResponse createOrRetrieve(String email, ConversationCreateRequest request) {
        UserAccount current = findAccount(email);
        UserAccount participant = userRepository.findById(request.participantId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation participant not found"));
        if (current.getRole() == participant.getRole()) {
            throw new IllegalArgumentException("A conversation must have one donor and one hospital");
        }

        UserAccount donor = current.getRole() == UserRole.DONOR ? current : participant;
        UserAccount hospital = current.getRole() == UserRole.HOSPITAL ? current : participant;
        if (donor.getRole() != UserRole.DONOR || hospital.getRole() != UserRole.HOSPITAL) {
            throw new IllegalArgumentException("A conversation must have one donor and one hospital");
        }

        BloodRequest bloodRequest = null;
        if (request.bloodRequestId() != null) {
            bloodRequest = bloodRequestRepository.findById(request.bloodRequestId())
                    .orElseThrow(() -> new ResourceNotFoundException("Blood request not found"));
            if (!bloodRequest.getRequestingHospital().getId().equals(hospital.getId())
                    || bloodRequest.getStatus() != BloodRequestStatus.OPEN
                    || !bloodRequest.getRequiredBy().isAfter(java.time.Instant.now(clock))) {
                throw new ResourceNotFoundException("Blood request not found");
            }
            boolean isEligibleMatch = donorMatchingService.searchDonors(new DonorSearchRequest(
                            bloodRequest.getBloodGroup(), bloodRequest.getLatitude(), bloodRequest.getLongitude(), null))
                    .stream().anyMatch(match -> match.id().equals(donor.getId()));
            if (!isEligibleMatch) {
                throw new AccessDeniedException("Donor is not an eligible match for this request");
            }
            var existing = chatRepository.findByBloodRequest_IdAndDonor_IdAndHospital_Id(
                    bloodRequest.getId(), donor.getId(), hospital.getId());
            if (existing.isPresent()) {
                Chat chat = existing.get();
                return ConversationResponse.from(chat, unreadCount(chat, current));
            }
            return saveConversation(request, bloodRequest, donor, hospital);
        }

        var existing = chatRepository.findRequestlessConversation(donor.getId(), hospital.getId());
        if (existing.isPresent()) {
            Chat chat = existing.get();
            return ConversationResponse.from(chat, unreadCount(chat, current));
        }
        return saveConversation(request, null, donor, hospital);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> listConversations(String email) {
        UserAccount current = findAccount(email);
        List<Chat> chats = chatRepository.findByDonor_IdOrHospital_IdOrderByUpdatedAtDesc(
                current.getId(), current.getId());
        if (chats.isEmpty()) {
            return List.of();
        }
        Map<UUID, Long> unreadCounts = new HashMap<>();
        for (UnreadCountProjection projection :
                messageRepository.countUnreadMessages(chats.stream().map(Chat::getId).toList(), current.getId())) {
            unreadCounts.put(projection.getChatId(), projection.getUnreadCount());
        }
        return chats.stream()
                .map(chat -> ConversationResponse.from(chat, unreadCounts.getOrDefault(chat.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<ChatMessageResponse> getMessages(
            String email, UUID chatId, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("page must be non-negative and size must be between 1 and 100");
        }
        UserAccount current = findAccount(email);
        requireMembership(chatId, current);
        Page<ChatMessage> messages = messageRepository.findByChat_IdOrderByCreatedAtAsc(
                chatId, PageRequest.of(page, size));
        return new PagedResponse<>(
                messages.getContent().stream().map(ChatMessageResponse::from).toList(),
                messages.getNumber(),
                messages.getSize(),
                messages.getTotalElements(),
                messages.getTotalPages());
    }

    @Transactional
    public ChatMessageResponse sendMessage(String email, UUID chatId, MessageSendRequest request) {
        UserAccount current = findAccount(email);
        Chat chat = requireMembership(chatId, current);
        ChatMessage message = new ChatMessage();
        message.setChat(chat);
        message.setSender(current);
        message.setSenderRole(current.getRole());
        message.setMessageText(request.message().trim());
        ChatMessage saved = messageRepository.save(message);
        if (current.getRole() == UserRole.DONOR) {
            chat.setUnreadForHospital(true);
        } else {
            chat.setUnreadForDonor(true);
        }
        chatRepository.save(chat);
        return ChatMessageResponse.from(saved);
    }

    @Transactional
    public ConversationResponse markRead(String email, UUID chatId) {
        UserAccount current = findAccount(email);
        Chat chat = requireMembership(chatId, current);
        List<ChatMessage> unread = messageRepository.findByChat_IdAndSender_IdNotAndReadAtIsNull(
                chatId, current.getId());
        java.time.Instant readAt = java.time.Instant.now(clock);
        unread.forEach(message -> message.setReadAt(readAt));
        if (!unread.isEmpty()) {
            messageRepository.saveAll(unread);
        }
        if (current.getRole() == UserRole.DONOR) {
            chat.setUnreadForDonor(false);
        } else {
            chat.setUnreadForHospital(false);
        }
        Chat saved = chatRepository.save(chat);
        return ConversationResponse.from(saved, 0);
    }

    private ConversationResponse saveConversation(
            ConversationCreateRequest request,
            BloodRequest bloodRequest,
            UserAccount donor,
            UserAccount hospital) {
        Chat chat = new Chat();
        chat.setBloodRequest(bloodRequest);
        chat.setDonor(donor);
        chat.setHospital(hospital);
        chat.setTitle(request.title() == null ? null : request.title().trim());
        Chat saved = chatRepository.save(chat);
        return ConversationResponse.from(saved, 0);
    }

    private Chat requireMembership(UUID chatId, UserAccount current) {
        return chatRepository.findMembership(chatId, current.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
    }

    private long unreadCount(Chat chat, UserAccount current) {
        return messageRepository.countUnreadMessages(List.of(chat.getId()), current.getId()).stream()
                .mapToLong(UnreadCountProjection::getUnreadCount)
                .findFirst()
                .orElse(0L);
    }

    private UserAccount findAccount(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
    }
}

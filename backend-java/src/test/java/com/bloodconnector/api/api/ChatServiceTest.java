package com.bloodconnector.api.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.bloodconnector.api.domain.Chat;
import com.bloodconnector.api.domain.ChatMessage;
import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;
import com.bloodconnector.api.repository.BloodRequestRepository;
import com.bloodconnector.api.repository.ChatMessageRepository;
import com.bloodconnector.api.repository.ChatRepository;
import com.bloodconnector.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-10-13T00:00:00Z"), ZoneOffset.UTC);

    @Mock
    private UserRepository userRepository;
    @Mock
    private ChatRepository chatRepository;
    @Mock
    private ChatMessageRepository messageRepository;
    @Mock
    private BloodRequestRepository bloodRequestRepository;
    @Mock
    private DonorMatchingService donorMatchingService;

    private ChatService service;
    private UserAccount donor;
    private UserAccount hospital;
    private Chat chat;
    private UUID chatId;

    @BeforeEach
    void setUp() {
        service = new ChatService(
                userRepository, chatRepository, messageRepository, bloodRequestRepository,
                donorMatchingService, CLOCK);
        donor = user(UserRole.DONOR, "donor@example.com", "Donor");
        hospital = user(UserRole.HOSPITAL, "hospital@example.com", "Hospital");
        ReflectionTestUtils.setField(donor, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(hospital, "id", UUID.randomUUID());
        chatId = UUID.randomUUID();
        chat = new Chat();
        ReflectionTestUtils.setField(chat, "id", chatId);
        chat.setDonor(donor);
        chat.setHospital(hospital);
    }

    @Test
    void requestlessConversationIsCreatedAndCanBeRetrievedAgain() {
        when(userRepository.findByEmailIgnoreCase("hospital@example.com")).thenReturn(Optional.of(hospital));
        when(userRepository.findById(donor.getId())).thenReturn(Optional.of(donor));
        when(chatRepository.findRequestlessConversation(donor.getId(), hospital.getId()))
                .thenReturn(Optional.empty(), Optional.of(chat));
        when(chatRepository.save(any(Chat.class))).thenAnswer(invocation -> {
            Chat saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", chatId);
            return saved;
        });
        when(messageRepository.countUnreadMessages(List.of(chatId), hospital.getId())).thenReturn(List.of());

        ConversationCreateRequest request = new ConversationCreateRequest(donor.getId(), null, "Help");
        ConversationResponse created = service.createOrRetrieve("hospital@example.com", request);
        ConversationResponse retrieved = service.createOrRetrieve("hospital@example.com", request);

        assertEquals(created.id(), retrieved.id());
        verify(chatRepository).save(any(Chat.class));
    }

    @Test
    void everyMessageOperationRequiresConversationMembership() {
        UserAccount outsider = user(UserRole.DONOR, "outsider@example.com", "Outsider");
        ReflectionTestUtils.setField(outsider, "id", UUID.randomUUID());
        when(userRepository.findByEmailIgnoreCase("outsider@example.com"))
                .thenReturn(Optional.of(outsider));
        when(chatRepository.findMembership(
                org.mockito.ArgumentMatchers.eq(chatId),
                org.mockito.ArgumentMatchers.any(UUID.class))).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.getMessages("outsider@example.com", chatId, 0, 50));
        assertThrows(ResourceNotFoundException.class,
                () -> service.sendMessage("outsider@example.com", chatId, new MessageSendRequest("hello")));
        assertThrows(ResourceNotFoundException.class,
                () -> service.markRead("outsider@example.com", chatId));

        verify(messageRepository, never()).findByChat_IdOrderByCreatedAtAsc(any(UUID.class), any(PageRequest.class));
        verify(messageRepository, never()).save(any(ChatMessage.class));
        verify(messageRepository, never()).saveAll(anyList());
    }

    @Test
    void memberCanSendMessageAndOnlyRecipientUnreadFlagIsRaised() {
        when(userRepository.findByEmailIgnoreCase("donor@example.com")).thenReturn(Optional.of(donor));
        when(chatRepository.findMembership(chatId, donor.getId())).thenReturn(Optional.of(chat));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(chatRepository.save(chat)).thenReturn(chat);

        ChatMessageResponse response = service.sendMessage(
                "donor@example.com", chatId, new MessageSendRequest("Hello hospital"));

        assertEquals("Hello hospital", response.message());
        org.junit.jupiter.api.Assertions.assertTrue(chat.isUnreadForHospital());
        org.junit.jupiter.api.Assertions.assertFalse(chat.isUnreadForDonor());
        verify(messageRepository).save(any(ChatMessage.class));
        verify(chatRepository).save(chat);
    }

    @Test
    void readingMarksOtherParticipantsMessagesAndClearsUnreadState() {
        when(userRepository.findByEmailIgnoreCase("donor@example.com")).thenReturn(Optional.of(donor));
        when(chatRepository.findMembership(chatId, donor.getId())).thenReturn(Optional.of(chat));
        ChatMessage unread = new ChatMessage();
        unread.setSender(hospital);
        unread.setMessageText("Please respond");
        chat.setUnreadForDonor(true);
        when(messageRepository.findByChat_IdAndSender_IdNotAndReadAtIsNull(chatId, donor.getId()))
                .thenReturn(List.of(unread));
        when(messageRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        when(chatRepository.save(chat)).thenReturn(chat);

        ConversationResponse response = service.markRead("donor@example.com", chatId);

        assertEquals(0, response.unreadCount());
        org.junit.jupiter.api.Assertions.assertNotNull(unread.getReadAt());
        org.junit.jupiter.api.Assertions.assertFalse(chat.isUnreadForDonor());
        verify(messageRepository).saveAll(List.of(unread));
    }

    @Test
    void invalidPaginationIsRejectedAndConversationRequiresOppositeRole() {
        assertThrows(IllegalArgumentException.class,
                () -> service.getMessages("donor@example.com", chatId, -1, 50));

        when(userRepository.findByEmailIgnoreCase("donor@example.com")).thenReturn(Optional.of(donor));
        when(userRepository.findById(donor.getId())).thenReturn(Optional.of(donor));
        assertThrows(IllegalArgumentException.class, () -> service.createOrRetrieve(
                "donor@example.com", new ConversationCreateRequest(donor.getId(), null, null)));
    }

    @Test
    void memberCanRetrieveMessagesUsingRequestedPage() {
        when(userRepository.findByEmailIgnoreCase("donor@example.com")).thenReturn(Optional.of(donor));
        when(chatRepository.findMembership(chatId, donor.getId())).thenReturn(Optional.of(chat));
        ChatMessage message = new ChatMessage();
        message.setChat(chat);
        message.setSender(hospital);
        message.setSenderRole(UserRole.HOSPITAL);
        message.setMessageText("Hello");
        when(messageRepository.findByChat_IdOrderByCreatedAtAsc(chatId, PageRequest.of(1, 1)))
                .thenReturn(new PageImpl<>(List.of(message), PageRequest.of(1, 1), 2));

        PagedResponse<ChatMessageResponse> response = service.getMessages("donor@example.com", chatId, 1, 1);

        assertEquals(1, response.page());
        assertEquals(2, response.totalElements());
        assertEquals("Hello", response.content().get(0).message());
    }

    private static UserAccount user(UserRole role, String email, String name) {
        UserAccount user = new UserAccount();
        user.setRole(role);
        user.setEmail(email);
        user.setName(name);
        user.setPhone("5551234");
        user.setLatitude(BigDecimal.ZERO);
        user.setLongitude(BigDecimal.ZERO);
        if (role == UserRole.DONOR) {
            user.setBloodGroup(com.bloodconnector.api.domain.BloodGroup.O_POSITIVE);
            user.setAvailable(true);
        } else {
            user.setHospitalName("City Hospital");
        }
        return user;
    }
}

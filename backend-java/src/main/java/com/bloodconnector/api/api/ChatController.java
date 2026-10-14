package com.bloodconnector.api.api;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ConversationResponse createOrRetrieve(
            Authentication authentication,
            @Valid @RequestBody ConversationCreateRequest request) {
        return chatService.createOrRetrieve(authentication.getName(), request);
    }

    @GetMapping
    public List<ConversationResponse> list(Authentication authentication) {
        return chatService.listConversations(authentication.getName());
    }

    @GetMapping("/{id}/messages")
    public PagedResponse<ChatMessageResponse> messages(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size) {
        return chatService.getMessages(authentication.getName(), id, page, size);
    }

    @PostMapping("/{id}/messages")
    public ChatMessageResponse sendMessage(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody MessageSendRequest request) {
        return chatService.sendMessage(authentication.getName(), id, request);
    }

    @PatchMapping("/{id}/read")
    public ConversationResponse markRead(Authentication authentication, @PathVariable UUID id) {
        return chatService.markRead(authentication.getName(), id);
    }
}

package com.bloodconnector.api.api;

import java.time.Instant;
import java.util.UUID;

import com.bloodconnector.api.domain.ChatMessage;
import com.bloodconnector.api.domain.UserRole;

public record ChatMessageResponse(
        UUID id,
        UUID senderId,
        UserRole senderRole,
        String senderName,
        String message,
        Instant createdAt,
        Instant readAt) {

    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getSender().getId(),
                message.getSenderRole(),
                message.getSender().getName(),
                message.getMessageText(),
                message.getCreatedAt(),
                message.getReadAt());
    }
}

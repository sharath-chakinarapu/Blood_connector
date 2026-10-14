package com.bloodconnector.api.api;

import java.time.Instant;
import java.util.UUID;

import com.bloodconnector.api.domain.Chat;

public record ConversationResponse(
        UUID id,
        ParticipantResponse donor,
        ParticipantResponse hospital,
        UUID bloodRequestId,
        String title,
        long unreadCount,
        Instant updatedAt) {

    public static ConversationResponse from(Chat chat, long unreadCount) {
        return new ConversationResponse(
                chat.getId(),
                ParticipantResponse.from(chat.getDonor()),
                ParticipantResponse.from(chat.getHospital()),
                chat.getBloodRequest() == null ? null : chat.getBloodRequest().getId(),
                chat.getTitle(),
                unreadCount,
                chat.getUpdatedAt());
    }
}

package com.bloodconnector.api.api;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ConversationCreateRequest(
        @NotNull UUID participantId,
        UUID bloodRequestId,
        @Size(max = 200) String title) {
}

package com.bloodconnector.api.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MessageSendRequest(@NotBlank @Size(max = 4000) String message) {
}

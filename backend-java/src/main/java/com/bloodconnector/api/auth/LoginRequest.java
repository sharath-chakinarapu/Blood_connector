package com.bloodconnector.api.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        String email,
        String username,
        @NotBlank String password) {

    public String identifier() {
        String value = email != null && !email.isBlank() ? email : username;
        if (value == null || value.isBlank()) {
            throw new InvalidRegistrationException("email or username is required");
        }
        return value;
    }
}

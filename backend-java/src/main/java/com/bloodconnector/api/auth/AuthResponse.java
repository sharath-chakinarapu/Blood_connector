package com.bloodconnector.api.auth;

public record AuthResponse(String accessToken, String tokenType, UserResponse user) {
}

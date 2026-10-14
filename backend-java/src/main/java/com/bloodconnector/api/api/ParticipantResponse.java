package com.bloodconnector.api.api;

import java.util.UUID;

import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;

public record ParticipantResponse(UUID id, String name, String hospitalName, UserRole role) {

    public static ParticipantResponse from(UserAccount account) {
        return new ParticipantResponse(
                account.getId(), account.getName(), account.getHospitalName(), account.getRole());
    }
}

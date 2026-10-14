package com.bloodconnector.api.auth;

import java.util.UUID;

import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;

public record UserResponse(
        UUID id,
        String name,
        String email,
        UserRole role,
        BloodGroup bloodGroup,
        String phone,
        String hospitalName,
        String address) {

    public static UserResponse from(UserAccount account) {
        return new UserResponse(
                account.getId(),
                account.getName(),
                account.getEmail(),
                account.getRole(),
                account.getBloodGroup(),
                account.getPhone(),
                account.getHospitalName(),
                account.getAddress());
    }
}

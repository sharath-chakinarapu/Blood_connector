package com.bloodconnector.api.api;

import java.math.BigDecimal;
import java.util.UUID;

import com.bloodconnector.api.domain.UserAccount;

public record HospitalProfileResponse(
        UUID id,
        String name,
        String email,
        String hospitalName,
        String phone,
        String address,
        BigDecimal latitude,
        BigDecimal longitude) {

    public static HospitalProfileResponse from(UserAccount account) {
        return new HospitalProfileResponse(account.getId(), account.getName(), account.getEmail(),
                account.getHospitalName(), account.getPhone(), account.getAddress(), account.getLatitude(),
                account.getLongitude());
    }
}

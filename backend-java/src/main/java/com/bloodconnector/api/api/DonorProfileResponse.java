package com.bloodconnector.api.api;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.domain.UserAccount;

public record DonorProfileResponse(
        UUID id,
        String name,
        String email,
        BloodGroup bloodGroup,
        String phone,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        boolean available,
        int donationCount,
        LocalDate lastDonationDate) {

    public static DonorProfileResponse from(UserAccount account) {
        return new DonorProfileResponse(account.getId(), account.getName(), account.getEmail(),
                account.getBloodGroup(), account.getPhone(), account.getAddress(), account.getLatitude(),
                account.getLongitude(), account.isAvailable(), account.getDonationCount(),
                account.getLastDonationDate());
    }
}

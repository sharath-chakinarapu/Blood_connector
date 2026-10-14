package com.bloodconnector.api.api;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.repository.DonorMatchProjection;

public record DonorMatchResponse(
        UUID id,
        String name,
        BloodGroup bloodGroup,
        String phone,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        LocalDate lastDonationDate,
        double distanceKm) {

    public static DonorMatchResponse from(DonorMatchProjection projection) {
        return new DonorMatchResponse(projection.getId(), projection.getName(),
                BloodGroup.valueOf(projection.getBloodGroup()), projection.getPhone(), projection.getAddress(),
                projection.getLatitude(), projection.getLongitude(), projection.getLastDonationDate(),
                projection.getDistanceKm());
    }
}

package com.bloodconnector.api.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.bloodconnector.api.domain.BloodRequest;
import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.domain.BloodRequestStatus;
import com.bloodconnector.api.domain.RequestUrgency;

public record BloodRequestResponse(
        UUID id,
        UUID hospitalId,
        String hospitalName,
        String hospitalDisplayName,
        BloodGroup bloodGroup,
        RequestUrgency urgency,
        String locationDescription,
        BigDecimal latitude,
        BigDecimal longitude,
        Instant requiredBy,
        int unitsRequired,
        String contactNumber,
        BloodRequestStatus status,
        Instant createdAt,
        Double distanceKm) {

    public static BloodRequestResponse from(BloodRequest request) {
        return from(request, null);
    }

    public static BloodRequestResponse from(BloodRequest request, Double distanceKm) {
        return new BloodRequestResponse(
                request.getId(),
                request.getRequestingHospital().getId(),
                request.getRequestingHospital().getHospitalName(),
                request.getRequestingHospital().getName(),
                request.getBloodGroup(),
                request.getUrgency(),
                request.getLocationDescription(),
                request.getLatitude(),
                request.getLongitude(),
                request.getRequiredBy(),
                request.getUnitsRequired(),
                request.getContactNumber(),
                request.getStatus(),
                request.getCreatedAt(),
                distanceKm);
    }
}

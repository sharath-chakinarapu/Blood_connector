package com.bloodconnector.api.api;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import com.bloodconnector.api.domain.BloodGroup;

public record DonorSearchRequest(
        @NotNull BloodGroup bloodGroup,
        @NotNull @DecimalMin("-90.000000") @DecimalMax("90.000000") BigDecimal latitude,
        @NotNull @DecimalMin("-180.000000") @DecimalMax("180.000000") BigDecimal longitude,
        @DecimalMin("0.1") @DecimalMax("30.0") BigDecimal maxDistanceKm) {

    public BigDecimal effectiveMaxDistanceKm() {
        return maxDistanceKm == null ? BigDecimal.valueOf(30) : maxDistanceKm;
    }
}

package com.bloodconnector.api.api;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.domain.RequestUrgency;

public record BloodRequestCreateRequest(
        @NotNull BloodGroup bloodGroup,
        @NotNull RequestUrgency urgency,
        @NotBlank @Size(max = 500) String locationDescription,
        @NotNull @DecimalMin("-90.000000") @DecimalMax("90.000000") BigDecimal latitude,
        @NotNull @DecimalMin("-180.000000") @DecimalMax("180.000000") BigDecimal longitude,
        @NotNull @Future Instant requiredBy,
        @Min(1) int unitsRequired,
        @NotBlank @Size(max = 30) String contactNumber) {
}

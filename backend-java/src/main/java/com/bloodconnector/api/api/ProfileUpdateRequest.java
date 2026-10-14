package com.bloodconnector.api.api;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import com.bloodconnector.api.domain.BloodGroup;

public record ProfileUpdateRequest(
        @Size(min = 1, max = 120) String name,
        @Size(min = 1, max = 30) String phone,
        @Size(max = 500) String address,
        @DecimalMin("-90.000000") @DecimalMax("90.000000") BigDecimal latitude,
        @DecimalMin("-180.000000") @DecimalMax("180.000000") BigDecimal longitude,
        BloodGroup bloodGroup,
        Boolean available,
        @PastOrPresent LocalDate lastDonationDate,
        @Size(min = 1, max = 160) String hospitalName) {
}

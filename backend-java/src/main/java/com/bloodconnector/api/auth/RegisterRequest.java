package com.bloodconnector.api.auth;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.domain.UserRole;

public record RegisterRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotNull UserRole role,
        BloodGroup bloodGroup,
        @NotBlank @Size(max = 30) String phone,
        @Size(max = 160) String hospitalName,
        @Size(max = 500) String address,
        @NotNull @DecimalMin("-90.000000") @DecimalMax("90.000000") BigDecimal latitude,
        @NotNull @DecimalMin("-180.000000") @DecimalMax("180.000000") BigDecimal longitude) {
}

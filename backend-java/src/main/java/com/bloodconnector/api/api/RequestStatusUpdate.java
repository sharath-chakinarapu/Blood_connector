package com.bloodconnector.api.api;

import jakarta.validation.constraints.NotNull;

import com.bloodconnector.api.domain.BloodRequestStatus;

public record RequestStatusUpdate(@NotNull BloodRequestStatus status) {
}

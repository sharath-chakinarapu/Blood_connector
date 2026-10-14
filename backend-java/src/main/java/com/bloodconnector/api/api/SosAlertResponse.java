package com.bloodconnector.api.api;

import java.util.List;

public record SosAlertResponse(
        BloodRequestResponse alert,
        List<DonorMatchResponse> eligibleDonors,
        String smsNotificationStatus) {
}

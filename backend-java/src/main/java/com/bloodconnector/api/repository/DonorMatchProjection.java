package com.bloodconnector.api.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface DonorMatchProjection {

    UUID getId();

    String getName();

    String getBloodGroup();

    String getPhone();

    String getAddress();

    BigDecimal getLatitude();

    BigDecimal getLongitude();

    LocalDate getLastDonationDate();

    double getDistanceKm();
}

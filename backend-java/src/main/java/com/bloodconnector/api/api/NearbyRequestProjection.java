package com.bloodconnector.api.api;

import java.util.UUID;

public interface NearbyRequestProjection {

    UUID getRequestId();

    double getDistanceKm();
}

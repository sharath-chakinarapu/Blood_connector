package com.bloodconnector.api.api;

import java.math.BigDecimal;

public record LocationSearchBounds(
        double minimumLatitude,
        double maximumLatitude,
        double longitudeRange,
        double minimumLongitude,
        double maximumLongitude,
        double wrappedMinimumLongitude,
        double wrappedMaximumLongitude) {

    private static final double KM_PER_DEGREE_LATITUDE = 110.574;
    private static final double KM_PER_DEGREE_LONGITUDE = 111.0;

    public static LocationSearchBounds around(BigDecimal latitude, BigDecimal longitude, BigDecimal radiusKm) {
        double centerLatitude = latitude.doubleValue();
        double centerLongitude = longitude.doubleValue();
        double latitudeRange = radiusKm.doubleValue() / KM_PER_DEGREE_LATITUDE;
        double longitudeDivisor = KM_PER_DEGREE_LONGITUDE
                * Math.max(Math.abs(Math.cos(Math.toRadians(centerLatitude))), 1.0e-12);
        double longitudeRange = Math.min(180.0, radiusKm.doubleValue() / longitudeDivisor);
        double minimumLongitude = centerLongitude - longitudeRange;
        double maximumLongitude = centerLongitude + longitudeRange;
        return new LocationSearchBounds(
                Math.max(-90.0, centerLatitude - latitudeRange),
                Math.min(90.0, centerLatitude + latitudeRange),
                longitudeRange,
                minimumLongitude,
                maximumLongitude,
                minimumLongitude + 360.0,
                maximumLongitude - 360.0);
    }
}

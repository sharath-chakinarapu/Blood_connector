package com.bloodconnector.api.repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bloodconnector.api.api.NearbyRequestProjection;
import com.bloodconnector.api.domain.BloodRequest;
import com.bloodconnector.api.domain.BloodRequestStatus;

public interface BloodRequestRepository extends JpaRepository<BloodRequest, UUID> {

    List<BloodRequest> findByRequestingHospital_IdOrderByCreatedAtDesc(UUID hospitalId);

    List<BloodRequest> findByStatusOrderByCreatedAtDesc(BloodRequestStatus status);

    java.util.Optional<BloodRequest> findByIdAndRequestingHospital_Id(UUID id, UUID hospitalId);

    List<BloodRequest> findByRequestingHospital_IdAndSosTrueOrderByCreatedAtDesc(UUID hospitalId);

    java.util.Optional<BloodRequest> findByIdAndRequestingHospital_IdAndSosTrue(UUID id, UUID hospitalId);

    @EntityGraph(attributePaths = "requestingHospital")
    List<BloodRequest> findByIdIn(Collection<UUID> ids);

    @Query(value = """
            WITH nearby_requests AS (
                SELECT r.id,
                       6371.0088 * 2 * ASIN(SQRT(GREATEST(0.0, LEAST(1.0,
                           POWER(SIN(RADIANS(CAST(r.latitude AS double precision)
                               - CAST(:latitude AS double precision)) / 2.0), 2)
                           + COS(RADIANS(CAST(:latitude AS double precision)))
                           * COS(RADIANS(CAST(r.latitude AS double precision)))
                           * POWER(SIN(RADIANS(CAST(r.longitude AS double precision)
                               - CAST(:longitude AS double precision)) / 2.0), 2)
                       )))) AS distance_km
                FROM blood_requests r
                WHERE r.status = 'OPEN'
                  AND r.blood_group = :bloodGroup
                  AND r.required_by > CURRENT_TIMESTAMP
                  AND r.latitude BETWEEN :minimumLatitude AND :maximumLatitude
                  AND (
                      :longitudeRange >= 180.0
                      OR (:minimumLongitude >= -180.0 AND :maximumLongitude <= 180.0
                          AND r.longitude BETWEEN :minimumLongitude AND :maximumLongitude)
                      OR (:minimumLongitude < -180.0
                          AND (r.longitude >= :wrappedMinimumLongitude OR r.longitude <= :maximumLongitude))
                      OR (:maximumLongitude > 180.0
                          AND (r.longitude >= :minimumLongitude OR r.longitude <= :wrappedMaximumLongitude))
                  )
            )
            SELECT id AS "requestId", distance_km AS "distanceKm"
            FROM nearby_requests
            WHERE distance_km <= :maxDistanceKm
            ORDER BY distance_km ASC, id ASC
            """, nativeQuery = true)
    List<NearbyRequestProjection> findOpenMatchingRequestsNear(
            @Param("bloodGroup") String bloodGroup,
            @Param("latitude") BigDecimal latitude,
            @Param("longitude") BigDecimal longitude,
            @Param("minimumLatitude") double minimumLatitude,
            @Param("maximumLatitude") double maximumLatitude,
            @Param("longitudeRange") double longitudeRange,
            @Param("minimumLongitude") double minimumLongitude,
            @Param("maximumLongitude") double maximumLongitude,
            @Param("wrappedMinimumLongitude") double wrappedMinimumLongitude,
            @Param("wrappedMaximumLongitude") double wrappedMaximumLongitude,
            @Param("maxDistanceKm") BigDecimal maxDistanceKm);
}

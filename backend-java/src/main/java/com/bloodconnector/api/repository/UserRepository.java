package com.bloodconnector.api.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;

public interface UserRepository extends JpaRepository<UserAccount, UUID> {

    Optional<UserAccount> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Optional<UserAccount> findByEmailIgnoreCaseAndRole(String email, UserRole role);

    @Query(value = """
            WITH eligible_donors AS (
                SELECT u.id, u.name, u.blood_group, u.phone, u.address, u.latitude, u.longitude,
                       u.last_donation_date,
                       6371.0088 * 2 * ASIN(SQRT(GREATEST(0.0, LEAST(1.0,
                           POWER(SIN(RADIANS(CAST(u.latitude AS double precision)
                               - CAST(:latitude AS double precision)) / 2.0), 2)
                           + COS(RADIANS(CAST(:latitude AS double precision)))
                           * COS(RADIANS(CAST(u.latitude AS double precision)))
                           * POWER(SIN(RADIANS(CAST(u.longitude AS double precision)
                               - CAST(:longitude AS double precision)) / 2.0), 2)
                       )))) AS distance_km
                FROM users u
                WHERE u.role = 'DONOR'
                  AND u.enabled = TRUE
                  AND u.available = TRUE
                  AND u.blood_group = :bloodGroup
                  AND (u.last_donation_date IS NULL OR u.last_donation_date <= :eligibleBefore)
                  AND u.latitude BETWEEN :minimumLatitude AND :maximumLatitude
                  AND (
                      :longitudeRange >= 180.0
                      OR (:minimumLongitude >= -180.0 AND :maximumLongitude <= 180.0
                          AND u.longitude BETWEEN :minimumLongitude AND :maximumLongitude)
                      OR (:minimumLongitude < -180.0
                          AND (u.longitude >= :wrappedMinimumLongitude OR u.longitude <= :maximumLongitude))
                      OR (:maximumLongitude > 180.0
                          AND (u.longitude >= :minimumLongitude OR u.longitude <= :wrappedMaximumLongitude))
                  )
            )
            SELECT id, name, blood_group AS "bloodGroup", phone, address, latitude, longitude,
                   last_donation_date AS "lastDonationDate", distance_km AS "distanceKm"
            FROM eligible_donors
            WHERE distance_km <= :maxDistanceKm
            ORDER BY distance_km ASC, id ASC
            """, nativeQuery = true)
    List<DonorMatchProjection> findEligibleDonorsNear(
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
            @Param("eligibleBefore") LocalDate eligibleBefore,
            @Param("maxDistanceKm") BigDecimal maxDistanceKm);
}

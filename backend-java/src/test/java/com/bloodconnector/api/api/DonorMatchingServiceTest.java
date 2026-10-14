package com.bloodconnector.api.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.repository.DonorMatchProjection;
import com.bloodconnector.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DonorMatchingServiceTest {

    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-10-13T00:00:00Z"), ZoneOffset.UTC);

    @Mock
    private UserRepository userRepository;

    private DonorMatchingService service;

    @BeforeEach
    void setUp() {
        service = new DonorMatchingService(userRepository, CLOCK);
    }

    @Test
    void returnsNearestEligibleResultsFirstAndUsesNinetyDayCutoffAndDistanceLimit() {
        DonorMatchProjection nearest = projection(3.25);
        DonorMatchProjection farther = projection(12.5);
        when(userRepository.findEligibleDonorsNear(
                org.mockito.ArgumentMatchers.eq("O_POSITIVE"),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.eq(LocalDate.of(2026, 7, 15)),
                org.mockito.ArgumentMatchers.eq(BigDecimal.valueOf(30))))
                .thenReturn(List.of(nearest, farther));

        List<DonorMatchResponse> results = service.searchDonors(search(null));

        assertEquals(2, results.size());
        assertEquals(3.25, results.get(0).distanceKm());
        assertEquals(12.5, results.get(1).distanceKm());
        verify(userRepository).findEligibleDonorsNear(
                org.mockito.ArgumentMatchers.eq("O_POSITIVE"),
                org.mockito.ArgumentMatchers.eq(BigDecimal.ZERO),
                org.mockito.ArgumentMatchers.eq(BigDecimal.ZERO),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.anyDouble(),
                org.mockito.ArgumentMatchers.eq(LocalDate.of(2026, 7, 15)),
                org.mockito.ArgumentMatchers.eq(BigDecimal.valueOf(30)));
    }

    @Test
    void rejectsSearchRadiusOverThirtyKilometers() {
        assertThrows(IllegalArgumentException.class,
                () -> service.searchDonors(search(BigDecimal.valueOf(30.01))));
    }

    @Test
    void calculatesLatitudeAndWrappedLongitudeBoundsForEfficientSearch() {
        LocationSearchBounds bounds = LocationSearchBounds.around(
                BigDecimal.ZERO, BigDecimal.valueOf(179.99), BigDecimal.valueOf(30));

        assertEquals(-30 / 110.574, bounds.minimumLatitude(), 0.00001);
        assertEquals(30 / 110.574, bounds.maximumLatitude(), 0.00001);
        org.junit.jupiter.api.Assertions.assertTrue(bounds.maximumLongitude() > 180);
        org.junit.jupiter.api.Assertions.assertTrue(bounds.wrappedMaximumLongitude() < 0);
    }

    private static DonorSearchRequest search(BigDecimal radius) {
        return new DonorSearchRequest(
                BloodGroup.O_POSITIVE, BigDecimal.ZERO, BigDecimal.ZERO, radius);
    }

    private static DonorMatchProjection projection(double distance) {
        DonorMatchProjection projection = org.mockito.Mockito.mock(DonorMatchProjection.class);
        when(projection.getId()).thenReturn(java.util.UUID.randomUUID());
        when(projection.getName()).thenReturn("Donor");
        when(projection.getBloodGroup()).thenReturn("O_POSITIVE");
        when(projection.getDistanceKm()).thenReturn(distance);
        return projection;
    }
}

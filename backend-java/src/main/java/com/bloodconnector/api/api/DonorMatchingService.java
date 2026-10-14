package com.bloodconnector.api.api;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;

import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.repository.DonorMatchProjection;
import com.bloodconnector.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DonorMatchingService {

    private final UserRepository userRepository;
    private final Clock clock;

    public DonorMatchingService(UserRepository userRepository, Clock clock) {
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<DonorMatchResponse> searchDonors(DonorSearchRequest request) {
        BigDecimal maxDistance = request.effectiveMaxDistanceKm();
        if (maxDistance.compareTo(BigDecimal.ZERO) <= 0 || maxDistance.compareTo(BigDecimal.valueOf(30)) > 0) {
            throw new IllegalArgumentException("maxDistanceKm must be greater than 0 and at most 30");
        }
        LocationSearchBounds bounds = LocationSearchBounds.around(
                request.latitude(), request.longitude(), maxDistance);
        List<DonorMatchProjection> matches = userRepository.findEligibleDonorsNear(
                request.bloodGroup().name(),
                request.latitude(),
                request.longitude(),
                bounds.minimumLatitude(),
                bounds.maximumLatitude(),
                bounds.longitudeRange(),
                bounds.minimumLongitude(),
                bounds.maximumLongitude(),
                bounds.wrappedMinimumLongitude(),
                bounds.wrappedMaximumLongitude(),
                LocalDate.now(clock).minusDays(90),
                maxDistance);
        return matches.stream().map(DonorMatchResponse::from).toList();
    }
}

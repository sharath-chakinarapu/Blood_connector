package com.bloodconnector.api.api;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.bloodconnector.api.domain.BloodRequest;
import com.bloodconnector.api.domain.BloodRequestStatus;
import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;
import com.bloodconnector.api.repository.BloodRequestRepository;
import com.bloodconnector.api.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BloodRequestService {

    private static final BigDecimal MAX_MATCH_DISTANCE_KM = BigDecimal.valueOf(30);
    private final BloodRequestRepository bloodRequestRepository;
    private final UserRepository userRepository;
    private final DonorMatchingService donorMatchingService;
    private final Clock clock;

    public BloodRequestService(
            BloodRequestRepository bloodRequestRepository,
            UserRepository userRepository,
            DonorMatchingService donorMatchingService,
            Clock clock) {
        this.bloodRequestRepository = bloodRequestRepository;
        this.userRepository = userRepository;
        this.donorMatchingService = donorMatchingService;
        this.clock = clock;
    }

    @Transactional
    public BloodRequestResponse createRequest(String email, BloodRequestCreateRequest createRequest) {
        UserAccount hospital = findAccount(email, UserRole.HOSPITAL);
        BloodRequest request = new BloodRequest();
        request.setRequestingHospital(hospital);
        request.setBloodGroup(createRequest.bloodGroup());
        request.setUrgency(createRequest.urgency());
        request.setLocationDescription(createRequest.locationDescription().trim());
        request.setLatitude(createRequest.latitude());
        request.setLongitude(createRequest.longitude());
        request.setRequiredBy(createRequest.requiredBy());
        request.setUnitsRequired(createRequest.unitsRequired());
        request.setContactNumber(createRequest.contactNumber().trim());
        request.setStatus(BloodRequestStatus.OPEN);
        return BloodRequestResponse.from(bloodRequestRepository.save(request));
    }

    @Transactional(readOnly = true)
    public List<BloodRequestResponse> getHospitalRequests(String email) {
        UserAccount hospital = findAccount(email, UserRole.HOSPITAL);
        return bloodRequestRepository.findByRequestingHospital_IdOrderByCreatedAtDesc(hospital.getId())
                .stream().map(BloodRequestResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public BloodRequestResponse getRequest(String email, UUID requestId) {
        UserAccount account = findAccount(email, null);
        BloodRequest request = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found"));
        if (account.getRole() == UserRole.HOSPITAL) {
            if (!request.getRequestingHospital().getId().equals(account.getId())) {
                throw new ResourceNotFoundException("Blood request not found");
            }
        } else if (!isRelevantOpenRequest(account, request)) {
            throw new ResourceNotFoundException("Blood request not found");
        }
        return BloodRequestResponse.from(request);
    }

    @Transactional
    public BloodRequestResponse updateStatus(String email, UUID requestId, BloodRequestStatus status) {
        UserAccount hospital = findAccount(email, UserRole.HOSPITAL);
        BloodRequest request = bloodRequestRepository
                .findByIdAndRequestingHospital_Id(requestId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found"));
        if (request.getStatus() != status) {
            if (request.getStatus() != BloodRequestStatus.OPEN || status == BloodRequestStatus.OPEN) {
                throw new RequestStateException("Only open requests can be completed or dismissed");
            }
            request.setStatus(status);
        }
        return BloodRequestResponse.from(bloodRequestRepository.save(request));
    }

    @Transactional(readOnly = true)
    public List<BloodRequestResponse> getRelevantOpenRequests(String email) {
        UserAccount donor = findAccount(email, UserRole.DONOR);
        requireEligibleDonor(donor);
        LocationSearchBounds bounds = LocationSearchBounds.around(
                donor.getLatitude(), donor.getLongitude(), MAX_MATCH_DISTANCE_KM);
        List<NearbyRequestProjection> nearby = bloodRequestRepository.findOpenMatchingRequestsNear(
                donor.getBloodGroup().name(),
                donor.getLatitude(),
                donor.getLongitude(),
                bounds.minimumLatitude(),
                bounds.maximumLatitude(),
                bounds.longitudeRange(),
                bounds.minimumLongitude(),
                bounds.maximumLongitude(),
                bounds.wrappedMinimumLongitude(),
                bounds.wrappedMaximumLongitude(),
                MAX_MATCH_DISTANCE_KM);
        if (nearby.isEmpty()) {
            return List.of();
        }
        Map<UUID, BloodRequest> requestsById = bloodRequestRepository.findByIdIn(
                        nearby.stream().map(NearbyRequestProjection::getRequestId).toList())
                .stream().collect(Collectors.toMap(BloodRequest::getId, Function.identity()));
        return nearby.stream()
                .filter(match -> requestsById.containsKey(match.getRequestId()))
                .map(match -> BloodRequestResponse.from(
                        requestsById.get(match.getRequestId()), match.getDistanceKm()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DonorMatchResponse> findDonorsForRequest(String email, UUID requestId) {
        UserAccount hospital = findAccount(email, UserRole.HOSPITAL);
        BloodRequest request = bloodRequestRepository
                .findByIdAndRequestingHospital_Id(requestId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found"));
        if (request.getStatus() != BloodRequestStatus.OPEN) {
            return List.of();
        }
        return donorMatchingService.searchDonors(new DonorSearchRequest(
                request.getBloodGroup(),
                request.getLatitude(),
                request.getLongitude(),
                MAX_MATCH_DISTANCE_KM));
    }

    private UserAccount findAccount(String email, UserRole requiredRole) {
        UserAccount account = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        if (requiredRole != null && account.getRole() != requiredRole) {
            throw new AccessDeniedException("This operation is restricted to " + requiredRole.name() + " accounts");
        }
        return account;
    }

    private boolean isRelevantOpenRequest(UserAccount donor, BloodRequest request) {
        if (request.getStatus() != BloodRequestStatus.OPEN
                || !request.getRequiredBy().isAfter(java.time.Instant.now(clock))
                || donor.getBloodGroup() != request.getBloodGroup()) {
            return false;
        }
        requireEligibleDonor(donor);
        double distanceKm = haversineKm(
                donor.getLatitude().doubleValue(),
                donor.getLongitude().doubleValue(),
                request.getLatitude().doubleValue(),
                request.getLongitude().doubleValue());
        return donor.isAvailable() && distanceKm <= MAX_MATCH_DISTANCE_KM.doubleValue();
    }

    private void requireEligibleDonor(UserAccount donor) {
        LocalDate earliestEligible = LocalDate.now(clock).minusDays(90);
        if (!donor.isAvailable()
                || (donor.getLastDonationDate() != null && donor.getLastDonationDate().isAfter(earliestEligible))) {
            throw new AccessDeniedException("Donor is not currently eligible to view matching requests");
        }
    }

    private static double haversineKm(double latitude1, double longitude1, double latitude2, double longitude2) {
        double latitudeDelta = Math.toRadians(latitude2 - latitude1);
        double longitudeDelta = Math.toRadians(longitude2 - longitude1);
        double haversine = Math.pow(Math.sin(latitudeDelta / 2), 2)
                + Math.cos(Math.toRadians(latitude1)) * Math.cos(Math.toRadians(latitude2))
                * Math.pow(Math.sin(longitudeDelta / 2), 2);
        return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1.0, haversine)));
    }
}

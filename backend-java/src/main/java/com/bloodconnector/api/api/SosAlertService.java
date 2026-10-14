package com.bloodconnector.api.api;

import java.util.List;
import java.util.UUID;

import com.bloodconnector.api.domain.BloodRequest;
import com.bloodconnector.api.domain.BloodRequestStatus;
import com.bloodconnector.api.domain.RequestUrgency;
import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;
import com.bloodconnector.api.repository.BloodRequestRepository;
import com.bloodconnector.api.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SosAlertService {

    private final BloodRequestRepository bloodRequestRepository;
    private final UserRepository userRepository;
    private final DonorMatchingService donorMatchingService;
    private final MockSmsNotificationService smsNotificationService;

    public SosAlertService(
            BloodRequestRepository bloodRequestRepository,
            UserRepository userRepository,
            DonorMatchingService donorMatchingService,
            MockSmsNotificationService smsNotificationService) {
        this.bloodRequestRepository = bloodRequestRepository;
        this.userRepository = userRepository;
        this.donorMatchingService = donorMatchingService;
        this.smsNotificationService = smsNotificationService;
    }

    @Transactional
    public SosAlertResponse create(String email, SosCreateRequest createRequest) {
        UserAccount hospital = requireHospital(email);
        BloodRequest alert = new BloodRequest();
        alert.setRequestingHospital(hospital);
        alert.setBloodGroup(createRequest.bloodGroup());
        alert.setUrgency(RequestUrgency.CRITICAL);
        alert.setLocationDescription(createRequest.locationDescription().trim());
        alert.setLatitude(createRequest.latitude());
        alert.setLongitude(createRequest.longitude());
        alert.setRequiredBy(createRequest.requiredBy());
        alert.setUnitsRequired(createRequest.unitsRequired());
        alert.setContactNumber(createRequest.contactNumber().trim());
        alert.setStatus(BloodRequestStatus.OPEN);
        alert.setSos(true);
        BloodRequest saved = bloodRequestRepository.save(alert);

        List<DonorMatchResponse> donors = findMatches(saved);
        smsNotificationService.recordSuppressedNotification(saved.getId(), donors.size());
        return response(saved, donors);
    }

    @Transactional(readOnly = true)
    public List<SosAlertResponse> listOwn(String email) {
        UserAccount hospital = requireHospital(email);
        return bloodRequestRepository.findByRequestingHospital_IdAndSosTrueOrderByCreatedAtDesc(hospital.getId())
                .stream()
                .map(alert -> response(alert,
                        alert.getStatus() == BloodRequestStatus.OPEN ? findMatches(alert) : List.of()))
                .toList();
    }

    @Transactional(readOnly = true)
    public SosAlertResponse getOwn(String email, UUID alertId) {
        UserAccount hospital = requireHospital(email);
        BloodRequest alert = bloodRequestRepository
                .findByIdAndRequestingHospital_IdAndSosTrue(alertId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("SOS alert not found"));
        return response(alert,
                alert.getStatus() == BloodRequestStatus.OPEN ? findMatches(alert) : List.of());
    }

    @Transactional
    public SosAlertResponse updateStatus(String email, UUID alertId, BloodRequestStatus status) {
        UserAccount hospital = requireHospital(email);
        BloodRequest alert = bloodRequestRepository
                .findByIdAndRequestingHospital_IdAndSosTrue(alertId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("SOS alert not found"));
        if (alert.getStatus() != status) {
            if (alert.getStatus() != BloodRequestStatus.OPEN || status == BloodRequestStatus.OPEN) {
                throw new RequestStateException("Only open SOS alerts can be completed or dismissed");
            }
            alert.setStatus(status);
        }
        return response(bloodRequestRepository.save(alert), List.of());
    }

    private List<DonorMatchResponse> findMatches(BloodRequest alert) {
        return donorMatchingService.searchDonors(new DonorSearchRequest(
                alert.getBloodGroup(), alert.getLatitude(), alert.getLongitude(), null));
    }

    private static SosAlertResponse response(BloodRequest alert, List<DonorMatchResponse> donors) {
        return new SosAlertResponse(
                BloodRequestResponse.from(alert), donors, "SUPPRESSED_MOCK_MODE");
    }

    private UserAccount requireHospital(String email) {
        UserAccount hospital = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        if (hospital.getRole() != UserRole.HOSPITAL) {
            throw new AccessDeniedException("SOS alerts are restricted to hospital accounts");
        }
        return hospital;
    }
}

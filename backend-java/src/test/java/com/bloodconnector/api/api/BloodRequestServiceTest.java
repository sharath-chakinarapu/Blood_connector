package com.bloodconnector.api.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.domain.BloodRequest;
import com.bloodconnector.api.domain.BloodRequestStatus;
import com.bloodconnector.api.domain.RequestUrgency;
import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;
import com.bloodconnector.api.repository.BloodRequestRepository;
import com.bloodconnector.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class BloodRequestServiceTest {

    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-10-13T00:00:00Z"), ZoneOffset.UTC);

    @Mock
    private BloodRequestRepository requestRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DonorMatchingService donorMatchingService;

    private BloodRequestService service;

    @BeforeEach
    void setUp() {
        service = new BloodRequestService(requestRepository, userRepository, donorMatchingService, CLOCK);
    }

    @Test
    void creationUsesAuthenticatedHospitalAndStartsOpen() {
        UserAccount hospital = hospital();
        when(userRepository.findByEmailIgnoreCase("hospital@example.com")).thenReturn(Optional.of(hospital));
        when(requestRepository.save(any(BloodRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BloodRequestResponse response = service.createRequest("hospital@example.com", createRequest());

        assertEquals(BloodRequestStatus.OPEN, response.status());
        assertEquals("City Hospital", response.hospitalName());
        org.mockito.ArgumentCaptor<BloodRequest> captor = org.mockito.ArgumentCaptor.forClass(BloodRequest.class);
        verify(requestRepository).save(captor.capture());
        assertEquals(hospital, captor.getValue().getRequestingHospital());
    }

    @Test
    void hospitalCannotViewOrUpdateAnotherHospitalsRequest() {
        UserAccount hospital = hospital();
        UUID accountId = UUID.randomUUID();
        ReflectionTestUtils.setField(hospital, "id", accountId);
        UUID requestId = UUID.randomUUID();
        when(userRepository.findByEmailIgnoreCase("hospital@example.com")).thenReturn(Optional.of(hospital));
        when(requestRepository.findByIdAndRequestingHospital_Id(requestId, accountId))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.updateStatus("hospital@example.com", requestId, BloodRequestStatus.DISMISSED));
        assertThrows(ResourceNotFoundException.class,
                () -> service.findDonorsForRequest("hospital@example.com", requestId));
    }

    @Test
    void donorCannotCreateHospitalRequest() {
        UserAccount donor = new UserAccount();
        donor.setRole(UserRole.DONOR);
        when(userRepository.findByEmailIgnoreCase("donor@example.com")).thenReturn(Optional.of(donor));

        assertThrows(AccessDeniedException.class,
                () -> service.createRequest("donor@example.com", createRequest()));
    }

    @Test
    void onlyOpenRequestsCanTransitionToTerminalStatus() {
        UserAccount hospital = hospital();
        UUID accountId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        ReflectionTestUtils.setField(hospital, "id", accountId);
        BloodRequest request = new BloodRequest();
        request.setRequestingHospital(hospital);
        request.setStatus(BloodRequestStatus.COMPLETED);
        when(userRepository.findByEmailIgnoreCase("hospital@example.com")).thenReturn(Optional.of(hospital));
        when(requestRepository.findByIdAndRequestingHospital_Id(requestId, accountId))
                .thenReturn(Optional.of(request));

        assertThrows(RequestStateException.class,
                () -> service.updateStatus("hospital@example.com", requestId, BloodRequestStatus.DISMISSED));
    }

    @Test
    void donorCanViewMatchingOpenRequestAtThirtyKilometersButNotBeyond() {
        UserAccount donor = donor();
        UUID requestId = UUID.randomUUID();
        BloodRequest request = matchingRequest(donor, 30.0);
        when(userRepository.findByEmailIgnoreCase("donor@example.com")).thenReturn(Optional.of(donor));
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(request));

        assertEquals(BloodRequestStatus.OPEN,
                service.getRequest("donor@example.com", requestId).status());

        request.setLongitude(BigDecimal.valueOf(0.27));
        assertThrows(ResourceNotFoundException.class,
                () -> service.getRequest("donor@example.com", requestId));
    }

    @Test
    void donorNeedsAvailabilityAndNinetyDaysSinceLastDonationToViewRequests() {
        UserAccount donor = donor();
        donor.setLastDonationDate(LocalDate.of(2026, 7, 16));
        UUID requestId = UUID.randomUUID();
        BloodRequest request = matchingRequest(donor, 1.0);
        when(userRepository.findByEmailIgnoreCase("donor@example.com")).thenReturn(Optional.of(donor));
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(request));

        assertThrows(AccessDeniedException.class,
                () -> service.getRequest("donor@example.com", requestId));

        donor.setLastDonationDate(LocalDate.of(2026, 7, 15));
        donor.setAvailable(false);
        assertThrows(AccessDeniedException.class,
                () -> service.getRequest("donor@example.com", requestId));
    }

    private static UserAccount hospital() {
        UserAccount hospital = new UserAccount();
        hospital.setName("Hospital");
        hospital.setEmail("hospital@example.com");
        hospital.setRole(UserRole.HOSPITAL);
        hospital.setHospitalName("City Hospital");
        hospital.setPhone("5551234");
        hospital.setLatitude(BigDecimal.ZERO);
        hospital.setLongitude(BigDecimal.ZERO);
        return hospital;
    }

    private static BloodRequestCreateRequest createRequest() {
        return new BloodRequestCreateRequest(
                BloodGroup.O_POSITIVE,
                RequestUrgency.HIGH,
                "City Hospital",
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                Instant.parse("2026-10-14T00:00:00Z"),
                2,
                "5551234");
    }

    private static UserAccount donor() {
        UserAccount donor = new UserAccount();
        donor.setName("Donor");
        donor.setEmail("donor@example.com");
        donor.setRole(UserRole.DONOR);
        donor.setBloodGroup(BloodGroup.O_POSITIVE);
        donor.setPhone("5551234");
        donor.setLatitude(BigDecimal.ZERO);
        donor.setLongitude(BigDecimal.ZERO);
        donor.setAvailable(true);
        return donor;
    }

    private static BloodRequest matchingRequest(UserAccount donor, double distanceKm) {
        BloodRequest request = new BloodRequest();
        request.setRequestingHospital(hospital());
        request.setStatus(BloodRequestStatus.OPEN);
        request.setBloodGroup(donor.getBloodGroup());
        request.setRequiredBy(Instant.parse("2026-10-14T00:00:00Z"));
        double longitude = Math.toDegrees(distanceKm / 6371.0088);
        request.setLatitude(BigDecimal.ZERO);
        request.setLongitude(BigDecimal.valueOf(longitude));
        return request;
    }
}

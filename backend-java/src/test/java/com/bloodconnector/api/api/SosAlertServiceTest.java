package com.bloodconnector.api.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.domain.BloodRequest;
import com.bloodconnector.api.domain.BloodRequestStatus;
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
class SosAlertServiceTest {

    @Mock
    private BloodRequestRepository requestRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DonorMatchingService donorMatchingService;
    @Mock
    private MockSmsNotificationService smsNotificationService;

    private SosAlertService service;

    @BeforeEach
    void setUp() {
        service = new SosAlertService(
                requestRepository, userRepository, donorMatchingService, smsNotificationService);
    }

    @Test
    void createsCriticalAlertMatchesDonorsAndKeepsSmsSuppressed() {
        UserAccount hospital = hospital();
        ReflectionTestUtils.setField(hospital, "id", UUID.randomUUID());
        when(userRepository.findByEmailIgnoreCase("hospital@example.com")).thenReturn(Optional.of(hospital));
        when(requestRepository.save(any(BloodRequest.class))).thenAnswer(invocation -> {
            BloodRequest saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });
        DonorMatchResponse donor = new DonorMatchResponse(
                UUID.randomUUID(), "Donor", BloodGroup.O_POSITIVE, "5551234",
                null, BigDecimal.ZERO, BigDecimal.ZERO, null, 4.2);
        when(donorMatchingService.searchDonors(any())).thenReturn(List.of(donor));

        SosAlertResponse response = service.create("hospital@example.com", sosRequest());

        assertEquals(BloodRequestStatus.OPEN, response.alert().status());
        assertEquals(1, response.eligibleDonors().size());
        assertEquals("SUPPRESSED_MOCK_MODE", response.smsNotificationStatus());
        org.mockito.ArgumentCaptor<BloodRequest> alertCaptor =
                org.mockito.ArgumentCaptor.forClass(BloodRequest.class);
        verify(requestRepository).save(alertCaptor.capture());
        assertEquals(true, alertCaptor.getValue().isSos());
        assertEquals(com.bloodconnector.api.domain.RequestUrgency.CRITICAL, alertCaptor.getValue().getUrgency());
        verify(smsNotificationService).recordSuppressedNotification(
                alertCaptor.getValue().getId(), 1);
    }

    @Test
    void donorCannotCreateSosAndHospitalCannotManageOtherHospitalAlert() {
        UserAccount donor = new UserAccount();
        donor.setRole(UserRole.DONOR);
        when(userRepository.findByEmailIgnoreCase("donor@example.com")).thenReturn(Optional.of(donor));
        assertThrows(AccessDeniedException.class, () -> service.create("donor@example.com", sosRequest()));

        UserAccount hospital = hospital();
        ReflectionTestUtils.setField(hospital, "id", UUID.randomUUID());
        when(userRepository.findByEmailIgnoreCase("hospital@example.com")).thenReturn(Optional.of(hospital));
        when(requestRepository.findByIdAndRequestingHospital_IdAndSosTrue(
                any(UUID.class), any(UUID.class))).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> service.updateStatus("hospital@example.com", UUID.randomUUID(), BloodRequestStatus.DISMISSED));
    }

    private static UserAccount hospital() {
        UserAccount hospital = new UserAccount();
        hospital.setRole(UserRole.HOSPITAL);
        hospital.setEmail("hospital@example.com");
        hospital.setName("Hospital");
        hospital.setHospitalName("City Hospital");
        return hospital;
    }

    private static SosCreateRequest sosRequest() {
        return new SosCreateRequest(
                BloodGroup.O_POSITIVE, "Urgent", BigDecimal.ZERO, BigDecimal.ZERO,
                Instant.parse("2026-10-14T00:00:00Z"), 1, "5551234");
    }
}

package com.bloodconnector.api.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;
import com.bloodconnector.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private UserRepository userRepository;

    private ProfileService service;

    @BeforeEach
    void setUp() {
        service = new ProfileService(userRepository);
    }

    @Test
    void donorUpdatesUseAuthenticatedEmailAndExcludeAccountCredentials() {
        UserAccount donor = donor();
        when(userRepository.findByEmailIgnoreCaseAndRole("donor@example.com", UserRole.DONOR))
                .thenReturn(Optional.of(donor));
        when(userRepository.save(donor)).thenReturn(donor);

        DonorProfileResponse response = service.updateDonorProfile(
                "donor@example.com",
                new ProfileUpdateRequest("Updated donor", null, null, null, null,
                        BloodGroup.A_POSITIVE, false, null, null));

        assertEquals("Updated donor", response.name());
        assertEquals(BloodGroup.A_POSITIVE, response.bloodGroup());
        org.junit.jupiter.api.Assertions.assertFalse(response.available());
        org.junit.jupiter.api.Assertions.assertFalse(response.toString().contains("password"));
        verify(userRepository).findByEmailIgnoreCaseAndRole("donor@example.com", UserRole.DONOR);
    }

    @Test
    void preventsEditingOtherRoleFieldsAndRejectsWrongRole() {
        UserAccount donor = donor();
        when(userRepository.findByEmailIgnoreCaseAndRole("donor@example.com", UserRole.DONOR))
                .thenReturn(Optional.of(donor));

        assertThrows(IllegalArgumentException.class, () -> service.updateDonorProfile(
                "donor@example.com",
                new ProfileUpdateRequest(null, null, null, null, null, null, null, null, "Impersonated")));
        when(userRepository.findByEmailIgnoreCaseAndRole("hospital@example.com", UserRole.DONOR))
                .thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.getDonorProfile("hospital@example.com"));
    }

    @Test
    void updatesHospitalProfileWithoutAcceptingDonorFields() {
        UserAccount hospital = new UserAccount();
        hospital.setName("Hospital");
        hospital.setEmail("hospital@example.com");
        hospital.setRole(UserRole.HOSPITAL);
        hospital.setHospitalName("City Hospital");
        hospital.setPhone("5551234");
        hospital.setLatitude(BigDecimal.ZERO);
        hospital.setLongitude(BigDecimal.ZERO);
        when(userRepository.findByEmailIgnoreCaseAndRole("hospital@example.com", UserRole.HOSPITAL))
                .thenReturn(Optional.of(hospital));
        when(userRepository.save(hospital)).thenReturn(hospital);

        HospitalProfileResponse response = service.updateHospitalProfile(
                "hospital@example.com",
                new ProfileUpdateRequest(null, null, " Main St ", null, null, null, null, null, "New name"));

        assertEquals("New name", response.hospitalName());
        assertEquals("Main St", response.address());
        assertThrows(IllegalArgumentException.class, () -> service.updateHospitalProfile(
                "hospital@example.com",
                new ProfileUpdateRequest(null, null, null, null, null,
                        BloodGroup.O_POSITIVE, null, null, null)));
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
        donor.setPasswordHash("must-not-be-returned");
        return donor;
    }
}

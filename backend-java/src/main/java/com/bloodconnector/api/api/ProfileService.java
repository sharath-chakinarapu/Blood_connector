package com.bloodconnector.api.api;

import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;
import com.bloodconnector.api.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final UserRepository userRepository;

    public ProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DonorProfileResponse getDonorProfile(String email) {
        return DonorProfileResponse.from(findByRole(email, UserRole.DONOR));
    }

    @Transactional
    public DonorProfileResponse updateDonorProfile(String email, ProfileUpdateRequest update) {
        UserAccount account = findByRole(email, UserRole.DONOR);
        if (update.hospitalName() != null) {
            throw new IllegalArgumentException("hospitalName cannot be changed on a donor profile");
        }
        applyCommonUpdates(account, update);
        if (update.bloodGroup() != null) {
            account.setBloodGroup(update.bloodGroup());
        }
        if (update.available() != null) {
            account.setAvailable(update.available());
        }
        if (update.lastDonationDate() != null) {
            account.setLastDonationDate(update.lastDonationDate());
        }
        return DonorProfileResponse.from(userRepository.save(account));
    }

    @Transactional(readOnly = true)
    public HospitalProfileResponse getHospitalProfile(String email) {
        return HospitalProfileResponse.from(findByRole(email, UserRole.HOSPITAL));
    }

    @Transactional
    public HospitalProfileResponse updateHospitalProfile(String email, ProfileUpdateRequest update) {
        UserAccount account = findByRole(email, UserRole.HOSPITAL);
        if (update.bloodGroup() != null || update.available() != null || update.lastDonationDate() != null) {
            throw new IllegalArgumentException("Donor-only fields cannot be changed on a hospital profile");
        }
        applyCommonUpdates(account, update);
        if (update.hospitalName() != null) {
            if (update.hospitalName().isBlank()) {
                throw new IllegalArgumentException("hospitalName cannot be blank");
            }
            account.setHospitalName(update.hospitalName().trim());
        }
        return HospitalProfileResponse.from(userRepository.save(account));
    }

    private UserAccount findByRole(String email, UserRole role) {
        return userRepository.findByEmailIgnoreCaseAndRole(email, role)
                .orElseThrow(() -> new com.bloodconnector.api.api.ResourceNotFoundException("Profile not found"));
    }

    private static void applyCommonUpdates(UserAccount account, ProfileUpdateRequest update) {
        if (update.name() != null) {
            if (update.name().isBlank()) {
                throw new IllegalArgumentException("name cannot be blank");
            }
            account.setName(update.name().trim());
        }
        if (update.phone() != null) {
            if (update.phone().isBlank()) {
                throw new IllegalArgumentException("phone cannot be blank");
            }
            account.setPhone(update.phone().trim());
        }
        if (update.address() != null) {
            account.setAddress(update.address().trim());
        }
        if (update.latitude() != null) {
            account.setLatitude(update.latitude());
        }
        if (update.longitude() != null) {
            account.setLongitude(update.longitude());
        }
    }
}

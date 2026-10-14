package com.bloodconnector.api.api;

import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/api/donor/profile")
    public DonorProfileResponse donorProfile(Authentication authentication) {
        return profileService.getDonorProfile(authentication.getName());
    }

    @PatchMapping("/api/donor/profile")
    public DonorProfileResponse updateDonorProfile(
            Authentication authentication, @Valid @RequestBody ProfileUpdateRequest update) {
        return profileService.updateDonorProfile(authentication.getName(), update);
    }

    @GetMapping("/api/hospital/profile")
    public HospitalProfileResponse hospitalProfile(Authentication authentication) {
        return profileService.getHospitalProfile(authentication.getName());
    }

    @PatchMapping("/api/hospital/profile")
    public HospitalProfileResponse updateHospitalProfile(
            Authentication authentication, @Valid @RequestBody ProfileUpdateRequest update) {
        return profileService.updateHospitalProfile(authentication.getName(), update);
    }
}

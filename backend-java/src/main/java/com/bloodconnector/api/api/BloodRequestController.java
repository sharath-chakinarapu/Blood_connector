package com.bloodconnector.api.api;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import com.bloodconnector.api.domain.BloodRequestStatus;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/request")
public class BloodRequestController {

    private final BloodRequestService bloodRequestService;
    private final DonorMatchingService donorMatchingService;

    public BloodRequestController(
            BloodRequestService bloodRequestService,
            DonorMatchingService donorMatchingService) {
        this.bloodRequestService = bloodRequestService;
        this.donorMatchingService = donorMatchingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BloodRequestResponse createRequest(
            Authentication authentication, @Valid @RequestBody BloodRequestCreateRequest request) {
        return bloodRequestService.createRequest(authentication.getName(), request);
    }

    @GetMapping("/hospital")
    public List<BloodRequestResponse> hospitalRequests(Authentication authentication) {
        return bloodRequestService.getHospitalRequests(authentication.getName());
    }

    @GetMapping("/nearby")
    public List<BloodRequestResponse> nearbyRequests(Authentication authentication) {
        return bloodRequestService.getRelevantOpenRequests(authentication.getName());
    }

    @GetMapping("/donors")
    public List<DonorMatchResponse> searchDonors(
            @Valid @ModelAttribute DonorSearchRequest search) {
        return donorMatchingService.searchDonors(search);
    }

    @GetMapping("/alert/{id}/donors")
    public List<DonorMatchResponse> donorsForRequest(
            Authentication authentication, @PathVariable UUID id) {
        return bloodRequestService.findDonorsForRequest(authentication.getName(), id);
    }

    @GetMapping("/{id}")
    public BloodRequestResponse request(Authentication authentication, @PathVariable UUID id) {
        return bloodRequestService.getRequest(authentication.getName(), id);
    }

    @PatchMapping("/{id}/status")
    public BloodRequestResponse updateStatus(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody RequestStatusUpdate update) {
        return bloodRequestService.updateStatus(authentication.getName(), id, update.status());
    }
}

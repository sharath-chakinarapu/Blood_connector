package com.bloodconnector.api.api;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import com.bloodconnector.api.domain.BloodRequestStatus;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/request/sos")
public class SosAlertController {

    private final SosAlertService sosAlertService;

    public SosAlertController(SosAlertService sosAlertService) {
        this.sosAlertService = sosAlertService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SosAlertResponse create(
            Authentication authentication, @Valid @RequestBody SosCreateRequest request) {
        return sosAlertService.create(authentication.getName(), request);
    }

    @GetMapping
    public List<SosAlertResponse> listOwn(Authentication authentication) {
        return sosAlertService.listOwn(authentication.getName());
    }

    @GetMapping("/{id}")
    public SosAlertResponse getOwn(Authentication authentication, @PathVariable UUID id) {
        return sosAlertService.getOwn(authentication.getName(), id);
    }

    @PatchMapping("/{id}/status")
    public SosAlertResponse updateStatus(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody RequestStatusUpdate update) {
        return sosAlertService.updateStatus(authentication.getName(), id, update.status());
    }
}

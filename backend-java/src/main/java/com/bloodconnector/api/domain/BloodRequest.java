package com.bloodconnector.api.domain;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(
        name = "blood_requests",
        indexes = {
                @Index(name = "idx_blood_requests_hospital_created", columnList = "requesting_hospital_id,created_at"),
                @Index(name = "idx_blood_requests_status_coordinates", columnList = "status,latitude,longitude")
        })
public class BloodRequest extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requesting_hospital_id", nullable = false)
    private UserAccount requestingHospital;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "blood_group", nullable = false, length = 20)
    private BloodGroup bloodGroup;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequestUrgency urgency;

    @NotBlank
    @Size(max = 500)
    @Column(name = "location_description", nullable = false, length = 500)
    private String locationDescription;

    @NotNull
    @DecimalMin(value = "-90.000000")
    @DecimalMax(value = "90.000000")
    @Column(nullable = false, precision = 9, scale = 6)
    private BigDecimal latitude;

    @NotNull
    @DecimalMin(value = "-180.000000")
    @DecimalMax(value = "180.000000")
    @Column(nullable = false, precision = 9, scale = 6)
    private BigDecimal longitude;

    @NotNull
    @Column(name = "required_by", nullable = false)
    private Instant requiredBy;

    @NotNull
    @Min(1)
    @Column(name = "units_required", nullable = false)
    private int unitsRequired = 1;

    @NotBlank
    @Size(max = 30)
    @Column(name = "contact_number", nullable = false, length = 30)
    private String contactNumber;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BloodRequestStatus status = BloodRequestStatus.OPEN;

    @Column(name = "is_sos", nullable = false)
    private boolean sos;

    public UserAccount getRequestingHospital() {
        return requestingHospital;
    }

    public void setRequestingHospital(UserAccount requestingHospital) {
        this.requestingHospital = requestingHospital;
    }

    public BloodGroup getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(BloodGroup bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public RequestUrgency getUrgency() {
        return urgency;
    }

    public void setUrgency(RequestUrgency urgency) {
        this.urgency = urgency;
    }

    public String getLocationDescription() {
        return locationDescription;
    }

    public void setLocationDescription(String locationDescription) {
        this.locationDescription = locationDescription;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public Instant getRequiredBy() {
        return requiredBy;
    }

    public void setRequiredBy(Instant requiredBy) {
        this.requiredBy = requiredBy;
    }

    public int getUnitsRequired() {
        return unitsRequired;
    }

    public void setUnitsRequired(int unitsRequired) {
        this.unitsRequired = unitsRequired;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public BloodRequestStatus getStatus() {
        return status;
    }

    public void setStatus(BloodRequestStatus status) {
        this.status = status;
    }

    public boolean isSos() {
        return sos;
    }

    public void setSos(boolean sos) {
        this.sos = sos;
    }
}

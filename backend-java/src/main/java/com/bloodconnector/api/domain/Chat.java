package com.bloodconnector.api.domain;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(
        name = "chats",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_chats_request_donor_hospital",
                columnNames = {"blood_request_id", "donor_id", "hospital_id"}),
        indexes = {
                @Index(name = "idx_chats_donor_updated", columnList = "donor_id,updated_at"),
                @Index(name = "idx_chats_hospital_updated", columnList = "hospital_id,updated_at")
        })
public class Chat extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blood_request_id")
    private BloodRequest bloodRequest;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "donor_id", nullable = false)
    private UserAccount donor;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hospital_id", nullable = false)
    private UserAccount hospital;

    @Size(max = 200)
    @Column(length = 200)
    private String title;

    @Column(name = "unread_for_donor", nullable = false)
    private boolean unreadForDonor;

    @Column(name = "unread_for_hospital", nullable = false)
    private boolean unreadForHospital;

    @OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ChatMessage> messages = new ArrayList<>();

    public BloodRequest getBloodRequest() {
        return bloodRequest;
    }

    public void setBloodRequest(BloodRequest bloodRequest) {
        this.bloodRequest = bloodRequest;
    }

    public UserAccount getDonor() {
        return donor;
    }

    public void setDonor(UserAccount donor) {
        this.donor = donor;
    }

    public UserAccount getHospital() {
        return hospital;
    }

    public void setHospital(UserAccount hospital) {
        this.hospital = hospital;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isUnreadForDonor() {
        return unreadForDonor;
    }

    public void setUnreadForDonor(boolean unreadForDonor) {
        this.unreadForDonor = unreadForDonor;
    }

    public boolean isUnreadForHospital() {
        return unreadForHospital;
    }

    public void setUnreadForHospital(boolean unreadForHospital) {
        this.unreadForHospital = unreadForHospital;
    }

    public List<ChatMessage> getMessages() {
        return messages;
    }

    public void addMessage(ChatMessage message) {
        messages.add(message);
        message.setChat(this);
    }

    public void removeMessage(ChatMessage message) {
        messages.remove(message);
        message.setChat(null);
    }
}

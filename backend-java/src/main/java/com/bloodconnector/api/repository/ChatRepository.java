package com.bloodconnector.api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bloodconnector.api.domain.Chat;

public interface ChatRepository extends JpaRepository<Chat, UUID> {

    @EntityGraph(attributePaths = {"donor", "hospital", "bloodRequest"})
    List<Chat> findByDonor_IdOrHospital_IdOrderByUpdatedAtDesc(UUID donorId, UUID hospitalId);

    @EntityGraph(attributePaths = {"donor", "hospital", "bloodRequest"})
    Optional<Chat> findByBloodRequest_IdAndDonor_IdAndHospital_Id(
            UUID bloodRequestId, UUID donorId, UUID hospitalId);

    @EntityGraph(attributePaths = {"donor", "hospital", "bloodRequest"})
    @Query("select c from Chat c where c.bloodRequest is null "
            + "and c.donor.id = :donorId and c.hospital.id = :hospitalId")
    Optional<Chat> findRequestlessConversation(
            @Param("donorId") UUID donorId, @Param("hospitalId") UUID hospitalId);

    @EntityGraph(attributePaths = {"donor", "hospital", "bloodRequest"})
    @Query("select c from Chat c where c.id = :chatId "
            + "and (c.donor.id = :userId or c.hospital.id = :userId)")
    Optional<Chat> findMembership(@Param("chatId") UUID chatId, @Param("userId") UUID userId);
}

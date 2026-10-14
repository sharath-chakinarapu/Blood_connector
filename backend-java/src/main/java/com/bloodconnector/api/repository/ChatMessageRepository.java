package com.bloodconnector.api.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bloodconnector.api.domain.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    Page<ChatMessage> findByChat_IdOrderByCreatedAtAsc(UUID chatId, Pageable pageable);

    List<ChatMessage> findByChat_IdAndSender_IdNotAndReadAtIsNull(UUID chatId, UUID userId);

    @Query("""
            select m.chat.id as chatId, count(m) as unreadCount
            from ChatMessage m
            where m.chat.id in :chatIds
              and m.sender.id <> :userId
              and m.readAt is null
            group by m.chat.id
            """)
    List<UnreadCountProjection> countUnreadMessages(
            @Param("chatIds") List<UUID> chatIds, @Param("userId") UUID userId);
}

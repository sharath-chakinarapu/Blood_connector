package com.bloodconnector.api.repository;

import java.util.UUID;

public interface UnreadCountProjection {

    UUID getChatId();

    long getUnreadCount();
}

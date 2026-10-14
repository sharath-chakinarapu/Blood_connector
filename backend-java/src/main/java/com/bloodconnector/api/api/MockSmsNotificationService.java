package com.bloodconnector.api.api;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class MockSmsNotificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MockSmsNotificationService.class);

    public void recordSuppressedNotification(UUID alertId, int recipientCount) {
        LOGGER.info("SMS notification suppressed in mock mode for SOS alert {} (eligible recipient count: {})",
                alertId, recipientCount);
    }
}

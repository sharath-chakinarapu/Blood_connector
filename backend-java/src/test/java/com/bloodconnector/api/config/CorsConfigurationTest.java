package com.bloodconnector.api.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

class CorsConfigurationTest {

    @Test
    void registersConfiguredOriginsForApiRoutes() {
        CorsConfiguration configuration = new CorsConfiguration(
                "http://localhost:5173, https://blood-connector.example");
        TestCorsRegistry registry = new TestCorsRegistry();

        configuration.addCorsMappings(registry);

        org.springframework.web.cors.CorsConfiguration policy = registry.configurations().get("/api/**");
        assertEquals(List.of("http://localhost:5173", "https://blood-connector.example"), policy.getAllowedOrigins());
        assertEquals(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"), policy.getAllowedMethods());
        assertFalse(policy.getAllowCredentials());
    }

    @Test
    void rejectsWildcardOrMissingOrigins() {
        assertThrows(IllegalStateException.class, () -> new CorsConfiguration("*"));
        assertThrows(IllegalStateException.class, () -> new CorsConfiguration(" , "));
    }

    private static final class TestCorsRegistry extends CorsRegistry {

        Map<String, org.springframework.web.cors.CorsConfiguration> configurations() {
            return getCorsConfigurations();
        }
    }
}

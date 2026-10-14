package com.bloodconnector.api.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Base64;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

class JwtServiceTest {

    private static final byte[] KEY_BYTES = createKeyBytes(0);
    private static final String SECRET = Base64.getEncoder().encodeToString(KEY_BYTES);

    @Test
    void createsAndValidatesSignedToken() {
        JwtService jwtService = new JwtService(SECRET, 60_000);
        UserDetails user = user();

        String token = jwtService.generateToken(user);

        assertEquals(user.getUsername(), jwtService.extractSubject(token));
        assertTrue(jwtService.isTokenValid(token, user));
    }

    @Test
    void rejectsTokenSignedByAnotherKey() {
        JwtService jwtService = new JwtService(SECRET, 60_000);
        JwtService otherKey = new JwtService(
                Base64.getEncoder().encodeToString(createKeyBytes(1)),
                60_000);

        assertThrows(SignatureException.class, () -> jwtService.extractSubject(otherKey.generateToken(user())));
    }

    @Test
    void rejectsExpiredToken() {
        JwtService jwtService = new JwtService(SECRET, 60_000);
        String expired = Jwts.builder()
                .subject("donor@example.com")
                .issuedAt(new java.util.Date(System.currentTimeMillis() - 10_000))
                .expiration(new java.util.Date(System.currentTimeMillis() - 1_000))
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(KEY_BYTES))
                .compact();

        assertThrows(ExpiredJwtException.class, () -> jwtService.extractSubject(expired));
    }

    @Test
    void rejectsMissingOrWeakSecret() {
        assertThrows(IllegalStateException.class, () -> new JwtService("", 60_000));
        assertThrows(IllegalStateException.class, () -> new JwtService(
                Base64.getEncoder().encodeToString(new byte[16]), 60_000));
        assertThrows(IllegalStateException.class, () -> new JwtService(
                Base64.getEncoder().encodeToString(new byte[32]), 60_000));
    }

    private static UserDetails user() {
        return User.withUsername("donor@example.com")
                .password("encoded")
                .roles("DONOR")
                .build();
    }

    private static byte[] createKeyBytes(int offset) {
        byte[] bytes = new byte[32];
        for (int index = 0; index < bytes.length; index++) {
            bytes[index] = (byte) (index + offset);
        }
        return bytes;
    }
}

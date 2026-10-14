package com.bloodconnector.api.auth;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.SecretKey;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMillis;

    public JwtService(
            @Value("${app.security.jwt.secret}") String secret,
            @Value("${app.security.jwt.expiration-millis}") long expirationMillis) {
        if (secret == null || secret.isBlank() || expirationMillis <= 0) {
            throw new IllegalStateException("A valid JWT secret and positive expiration are required");
        }
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secret);
            if (keyBytes.length < 32 || !hasSufficientEntropy(keyBytes)) {
                throw new IllegalStateException(
                        "JWT_SECRET must decode to at least 32 bytes of high-entropy key material");
            }
            signingKey = Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("JWT_SECRET must be a Base64-encoded key of at least 32 bytes", exception);
        }
        this.expirationMillis = expirationMillis;
    }

    public String generateToken(UserDetails userDetails) {
        Date issuedAt = new Date();
        Date expiration = new Date(issuedAt.getTime() + expirationMillis);
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("roles", userDetails.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList())
                .issuedAt(issuedAt)
                .expiration(expiration)
                .signWith(signingKey)
                .compact();
    }

    public String extractSubject(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        Claims claims = parseClaims(token);
        return userDetails.isEnabled()
                && claims.getSubject().equals(userDetails.getUsername())
                && claims.getExpiration().after(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private static boolean hasSufficientEntropy(byte[] keyBytes) {
        Map<Byte, Integer> frequencies = new HashMap<>();
        for (byte keyByte : keyBytes) {
            frequencies.merge(keyByte, 1, Integer::sum);
        }
        if (frequencies.size() < 16) {
            return false;
        }
        double entropy = 0;
        for (int frequency : frequencies.values()) {
            double probability = (double) frequency / keyBytes.length;
            entropy -= probability * (Math.log(probability) / Math.log(2));
        }
        return entropy >= 3.5;
    }
}

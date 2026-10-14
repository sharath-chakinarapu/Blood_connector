package com.bloodconnector.api.auth;

import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;
import com.bloodconnector.api.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        validateBcryptPasswordLength(request.password());
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateAccountException();
        }
        validateRoleProfile(request);

        UserAccount account = new UserAccount();
        account.setName(request.name().trim());
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setRole(request.role());
        account.setPhone(request.phone().trim());
        account.setLatitude(request.latitude());
        account.setLongitude(request.longitude());
        account.setAddress(request.address());
        if (request.role() == UserRole.DONOR) {
            account.setBloodGroup(request.bloodGroup());
            account.setAvailable(true);
        } else {
            account.setHospitalName(request.hospitalName().trim());
            account.setAvailable(false);
        }

        try {
            UserAccount saved = userRepository.saveAndFlush(account);
            UserDetails principal = org.springframework.security.core.userdetails.User
                    .withUsername(saved.getEmail())
                    .password(saved.getPasswordHash())
                    .roles(saved.getRole().name())
                    .disabled(!saved.isEnabled())
                    .build();
            return createAuthResponse(principal, saved);
        } catch (DataIntegrityViolationException exception) {
            if (hasUniqueConstraintViolation(exception)) {
                throw new DuplicateAccountException();
            }
            throw exception;
        }
    }

    public AuthResponse login(LoginRequest request) {
        validateBcryptPasswordLength(request.password());
        String identifier = request.identifier().trim().toLowerCase(Locale.ROOT);
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(identifier, request.password()));
        UserDetails principal = (UserDetails) authentication.getPrincipal();
        UserAccount account = userRepository.findByEmailIgnoreCase(principal.getUsername())
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException(
                        "Account not found"));
        return createAuthResponse(principal, account);
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        UserAccount account = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException(
                        "Account not found"));
        return UserResponse.from(account);
    }

    private AuthResponse createAuthResponse(UserDetails principal, UserAccount account) {
        return new AuthResponse(jwtService.generateToken(principal), "Bearer", UserResponse.from(account));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static void validateRoleProfile(RegisterRequest request) {
        if (request.role() == UserRole.DONOR && request.bloodGroup() == null) {
            throw new InvalidRegistrationException("bloodGroup is required for donor accounts");
        }
        if (request.role() == UserRole.HOSPITAL
                && (request.hospitalName() == null || request.hospitalName().isBlank())) {
            throw new InvalidRegistrationException("hospitalName is required for hospital accounts");
        }
        if (request.role() == UserRole.DONOR && request.hospitalName() != null) {
            throw new InvalidRegistrationException("hospitalName is only allowed for hospital accounts");
        }
        if (request.role() == UserRole.HOSPITAL && request.bloodGroup() != null) {
            throw new InvalidRegistrationException("bloodGroup is only allowed for donor accounts");
        }
    }

    private static boolean hasUniqueConstraintViolation(Throwable exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLException sqlException && "23505".equals(sqlException.getSQLState())) {
                return true;
            }
        }
        return false;
    }

    private static void validateBcryptPasswordLength(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new InvalidRegistrationException("password must not exceed 72 UTF-8 bytes");
        }
    }
}

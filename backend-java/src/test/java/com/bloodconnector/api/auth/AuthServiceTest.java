package com.bloodconnector.api.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;
import com.bloodconnector.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;

    private BCryptPasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(userRepository, passwordEncoder, authenticationManager, jwtService);
    }

    @Test
    void registrationHashesPasswordAndReturnsNoPasswordHash() {
        RegisterRequest request = donorRegistration("SecretPassword123");
        when(userRepository.existsByEmailIgnoreCase("donor@example.com")).thenReturn(false);
        when(userRepository.saveAndFlush(any(UserAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(any())).thenReturn("signed-token");

        AuthResponse response = authService.register(request);

        ArgumentCaptor<UserAccount> accountCaptor = ArgumentCaptor.forClass(UserAccount.class);
        verify(userRepository).saveAndFlush(accountCaptor.capture());
        UserAccount saved = accountCaptor.getValue();
        assertEquals("signed-token", response.accessToken());
        assertEquals("donor@example.com", response.user().email());
        assertNotEquals(request.password(), saved.getPasswordHash());
        assertTrue(passwordEncoder.matches(request.password(), saved.getPasswordHash()));
        assertFalse(response.toString().contains(saved.getPasswordHash()));
    }

    @Test
    void duplicateEmailIsRejectedBeforeSaving() {
        when(userRepository.existsByEmailIgnoreCase("donor@example.com")).thenReturn(true);

        org.junit.jupiter.api.Assertions.assertThrows(
                DuplicateAccountException.class,
                () -> authService.register(donorRegistration("SecretPassword123")));
    }

    @Test
    void profileFieldsMustMatchSupportedRole() {
        RegisterRequest invalidHospital = new RegisterRequest(
                "Hospital", "hospital@example.com", "SecretPassword123", UserRole.HOSPITAL,
                BloodGroup.O_POSITIVE, "5551234", "Hospital", null, BigDecimal.ZERO, BigDecimal.ZERO);

        org.junit.jupiter.api.Assertions.assertThrows(
                InvalidRegistrationException.class, () -> authService.register(invalidHospital));
    }

    @Test
    void registrationRejectsPasswordsThatExceedBcryptByteLimit() {
        RegisterRequest request = donorRegistration("é".repeat(37));

        org.junit.jupiter.api.Assertions.assertThrows(
                InvalidRegistrationException.class, () -> authService.register(request));
    }

    @Test
    void loginAcceptsUsernameAsEmailIdentifier() {
        UserAccount account = new UserAccount();
        account.setEmail("donor@example.com");
        account.setName("Donor");
        account.setRole(UserRole.DONOR);
        account.setBloodGroup(BloodGroup.O_POSITIVE);
        account.setPhone("5551234");
        when(authenticationManager.authenticate(any())).thenAnswer(invocation -> {
            org.springframework.security.authentication.UsernamePasswordAuthenticationToken input =
                    invocation.getArgument(0);
            return org.springframework.security.authentication.UsernamePasswordAuthenticationToken
                    .authenticated(
                            org.springframework.security.core.userdetails.User
                                    .withUsername((String) input.getPrincipal())
                                    .password("hash")
                                    .roles("DONOR")
                                    .build(),
                            null,
                            java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                    "ROLE_DONOR")));
        });
        when(userRepository.findByEmailIgnoreCase("donor@example.com")).thenReturn(Optional.of(account));
        when(jwtService.generateToken(any())).thenReturn("signed-token");

        AuthResponse response = authService.login(new LoginRequest(null, "Donor@Example.com", "SecretPassword123"));

        assertEquals("donor@example.com", response.user().email());
    }

    private static RegisterRequest donorRegistration(String password) {
        return new RegisterRequest(
                "Donor",
                "Donor@Example.com",
                password,
                UserRole.DONOR,
                BloodGroup.O_POSITIVE,
                "5551234",
                null,
                null,
                BigDecimal.ZERO,
                BigDecimal.ZERO);
    }
}

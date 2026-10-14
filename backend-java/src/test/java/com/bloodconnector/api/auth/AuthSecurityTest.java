package com.bloodconnector.api.auth;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import com.bloodconnector.api.config.SecurityConfiguration;
import com.bloodconnector.api.api.ChatController;
import com.bloodconnector.api.api.ChatService;
import com.bloodconnector.api.api.SosAlertController;
import com.bloodconnector.api.api.SosAlertService;
import com.bloodconnector.api.domain.BloodGroup;
import com.bloodconnector.api.domain.UserAccount;
import com.bloodconnector.api.domain.UserRole;
import com.bloodconnector.api.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest({AuthController.class, ChatController.class, SosAlertController.class})
@Import({SecurityConfiguration.class, AuthExceptionHandler.class})
class AuthSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;
    @MockitoBean
    private ChatService chatService;
    @MockitoBean
    private SosAlertService sosAlertService;
    @MockitoBean
    private UserRepository userRepository;
    @MockitoBean
    private JwtService jwtService;

    @Test
    void registrationAndLoginArePublicButCurrentUserRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Donor","email":"donor@example.com","password":"SecretPassword123",
                                 "role":"DONOR","bloodGroup":"O_POSITIVE","phone":"5551234",
                                 "latitude":0,"longitude":0}
                                """))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"donor@example.com","password":"SecretPassword123"}
                                """))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/donor/profile")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/request")).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidBearerTokenIsUnauthenticated() throws Exception {
        when(jwtService.extractSubject("invalid")).thenThrow(new io.jsonwebtoken.MalformedJwtException("bad token"));

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer invalid"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void duplicateRegistrationAndInvalidCredentialsUseConflictAndUnauthorizedStatuses() throws Exception {
        doThrow(new DuplicateAccountException()).when(authService).register(any(RegisterRequest.class));
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Donor","email":"donor@example.com","password":"SecretPassword123",
                                 "role":"DONOR","bloodGroup":"O_POSITIVE","phone":"5551234",
                                 "latitude":0,"longitude":0}
                                """))
                .andExpect(status().isConflict());

        when(authService.login(any(LoginRequest.class))).thenThrow(new BadCredentialsException("invalid"));
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"donor@example.com","password":"wrong-password"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void roleRestrictedRoutesRejectTheOtherSupportedRole() throws Exception {
        when(jwtService.extractSubject("donor-token")).thenReturn("donor@example.com");
        when(jwtService.isTokenValid(anyString(),
                org.mockito.ArgumentMatchers.any(org.springframework.security.core.userdetails.UserDetails.class)))
                .thenReturn(true);
        when(userRepository.findByEmailIgnoreCase("donor@example.com"))
                .thenReturn(Optional.of(account(UserRole.DONOR)));

        mockMvc.perform(get("/api/hospital/private").header("Authorization", "Bearer donor-token"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/request").header("Authorization", "Bearer donor-token"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/hospital/profile").header("Authorization", "Bearer donor-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void validRoleCanPassAuthorizationEvenWhenNoPhaseThreeResourceExists() throws Exception {
        when(jwtService.extractSubject("donor-token")).thenReturn("donor@example.com");
        when(jwtService.isTokenValid(anyString(),
                org.mockito.ArgumentMatchers.any(org.springframework.security.core.userdetails.UserDetails.class)))
                .thenReturn(true);
        when(userRepository.findByEmailIgnoreCase("donor@example.com"))
                .thenReturn(Optional.of(account(UserRole.DONOR)));

        mockMvc.perform(get("/api/donor/future-resource").header("Authorization", "Bearer donor-token"))
                .andExpect(status().isNotFound());
    }

    @Test
    void validTokenCanReadCurrentUserWithoutPasswordData() throws Exception {
        when(jwtService.extractSubject("donor-token")).thenReturn("donor@example.com");
        when(jwtService.isTokenValid(anyString(),
                org.mockito.ArgumentMatchers.any(org.springframework.security.core.userdetails.UserDetails.class)))
                .thenReturn(true);
        when(userRepository.findByEmailIgnoreCase("donor@example.com"))
                .thenReturn(Optional.of(account(UserRole.DONOR)));
        when(authService.getCurrentUser("donor@example.com")).thenReturn(
                new UserResponse(null, "Donor", "donor@example.com", UserRole.DONOR,
                        BloodGroup.O_POSITIVE, "5551234", null, null));

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer donor-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("donor@example.com"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void sosAndChatRoutesRequireAuthenticationAndHospitalsForSosCreation() throws Exception {
        mockMvc.perform(post("/api/request/sos")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/chats")).andExpect(status().isUnauthorized());

        when(jwtService.extractSubject("donor-token")).thenReturn("donor@example.com");
        when(jwtService.isTokenValid(anyString(),
                org.mockito.ArgumentMatchers.any(org.springframework.security.core.userdetails.UserDetails.class)))
                .thenReturn(true);
        when(userRepository.findByEmailIgnoreCase("donor@example.com"))
                .thenReturn(Optional.of(account(UserRole.DONOR)));

        mockMvc.perform(post("/api/request/sos")
                        .header("Authorization", "Bearer donor-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/chats").header("Authorization", "Bearer donor-token"))
                .andExpect(status().isOk());
    }

    private static UserAccount account(UserRole role) {
        UserAccount account = new UserAccount();
        account.setEmail("donor@example.com");
        account.setName("Donor");
        account.setRole(role);
        account.setPasswordHash("hash");
        account.setPhone("5551234");
        if (role == UserRole.DONOR) {
            account.setBloodGroup(BloodGroup.O_POSITIVE);
        }
        return account;
    }
}

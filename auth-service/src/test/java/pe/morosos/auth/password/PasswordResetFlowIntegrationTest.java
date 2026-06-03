package pe.morosos.auth.password;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.blankOrNullString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import pe.morosos.auth.PostgresIntegrationTest;
import pe.morosos.auth.audit.repository.AuditLogRepository;
import pe.morosos.auth.audit.repository.LoginAttemptRepository;
import pe.morosos.auth.common.HttpHeadersConstants;
import pe.morosos.auth.password.entity.PasswordResetToken;
import pe.morosos.auth.password.repository.PasswordResetTokenRepository;
import pe.morosos.auth.user.entity.Usuario;
import pe.morosos.auth.user.repository.UsuarioRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PasswordResetFlowIntegrationTest extends PostgresIntegrationTest {

    private static final String GENERIC_FORGOT_MESSAGE =
            "Si los datos corresponden a una cuenta registrada, recibirás instrucciones para restablecer la contraseña.";
    private static final String OLD_PASSWORD = "OldPass123";
    private static final String NEW_PASSWORD = "NewPass123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private LoginAttemptRepository loginAttemptRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetService passwordResetService;

    @BeforeEach
    void setUp() {
        loginAttemptRepository.deleteAll();
        auditLogRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        usuarioRepository.deleteAll();
    }

    @Test
    void forgotPasswordForExistingUserReturnsGenericMessageAndCreatesHashedToken() throws Exception {
        Usuario usuario = saveUser("reset-user", "reset-user@local.test", true, OLD_PASSWORD);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("usernameOrEmail", "RESET-USER@local.test"))))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeadersConstants.REQUEST_ID, not(blankOrNullString())))
                .andExpect(jsonPath("$.message").value(GENERIC_FORGOT_MESSAGE));

        List<PasswordResetToken> tokens = passwordResetTokenRepository.findByUsuarioId(usuario.getId());
        assertThat(tokens).hasSize(1);
        assertThat(tokens.getFirst().getTokenHash()).isNotBlank();
        assertThat(tokens.getFirst().getTokenHash()).isNotEqualTo("RESET-USER@local.test");
        assertThat(tokens.getFirst().getUsedAt()).isNull();
        assertThat(tokens.getFirst().getExpiresAt()).isAfter(OffsetDateTime.now());
    }

    @Test
    void forgotPasswordForUnknownUserReturnsGenericMessageWithoutCreatingToken() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("usernameOrEmail", "missing@local.test"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(GENERIC_FORGOT_MESSAGE));

        assertThat(passwordResetTokenRepository.findAll()).isEmpty();
    }

    @Test
    void forgotPasswordForInactiveUserReturnsGenericMessageWithoutCreatingToken() throws Exception {
        Usuario usuario = saveUser("inactive-reset", "inactive-reset@local.test", false, OLD_PASSWORD);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("email", "inactive-reset@local.test"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(GENERIC_FORGOT_MESSAGE));

        assertThat(passwordResetTokenRepository.findByUsuarioId(usuario.getId())).isEmpty();
    }

    @Test
    void validResetTokenChangesPasswordMarksTokenUsedAndAllowsLoginWithNewPasswordOnly() throws Exception {
        Usuario usuario = saveUser("valid-reset", "valid-reset@local.test", true, OLD_PASSWORD);
        String token = "valid-reset-token-123";
        PasswordResetToken resetToken = saveToken(usuario, token, OffsetDateTime.now().plusMinutes(30), null);

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", token,
                                "newPassword", NEW_PASSWORD,
                                "confirmPassword", NEW_PASSWORD
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Contraseña restablecida correctamente."));

        PasswordResetToken usedToken = passwordResetTokenRepository.findById(resetToken.getId()).orElseThrow();
        Usuario updatedUser = usuarioRepository.findById(usuario.getId()).orElseThrow();
        assertThat(usedToken.getUsedAt()).isNotNull();
        assertThat(passwordEncoder.matches(NEW_PASSWORD, updatedUser.getPasswordHash())).isTrue();
        assertThat(passwordEncoder.matches(OLD_PASSWORD, updatedUser.getPasswordHash())).isFalse();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "usernameOrEmail", "valid-reset@local.test",
                                "password", NEW_PASSWORD
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "usernameOrEmail", "valid-reset@local.test",
                                "password", OLD_PASSWORD
                        ))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidResetTokenReturnsControlledBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", "does-not-exist",
                                "newPassword", NEW_PASSWORD,
                                "confirmPassword", NEW_PASSWORD
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PASSWORD_RESET_TOKEN_INVALID"));
    }

    @Test
    void expiredResetTokenReturnsControlledBadRequest() throws Exception {
        Usuario usuario = saveUser("expired-reset", "expired-reset@local.test", true, OLD_PASSWORD);
        String token = "expired-reset-token-123";
        saveToken(usuario, token, OffsetDateTime.now().minusMinutes(1), null);

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", token,
                                "newPassword", NEW_PASSWORD,
                                "confirmPassword", NEW_PASSWORD
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PASSWORD_RESET_TOKEN_EXPIRED"));
    }

    @Test
    void usedResetTokenReturnsControlledBadRequest() throws Exception {
        Usuario usuario = saveUser("used-reset", "used-reset@local.test", true, OLD_PASSWORD);
        String token = "used-reset-token-123";
        saveToken(usuario, token, OffsetDateTime.now().plusMinutes(30), OffsetDateTime.now().minusMinutes(1));

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", token,
                                "newPassword", NEW_PASSWORD,
                                "confirmPassword", NEW_PASSWORD
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PASSWORD_RESET_TOKEN_INVALID"));
    }

    @Test
    void passwordConfirmationMismatchReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", "any-token",
                                "newPassword", NEW_PASSWORD,
                                "confirmPassword", "Different123"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PASSWORD_RESET_PASSWORD_MISMATCH"));
    }

    @Test
    void weakPasswordReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", "any-token",
                                "newPassword", "weakpass",
                                "confirmPassword", "weakpass"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PASSWORD_RESET_PASSWORD_POLICY"));
    }

    private Usuario saveUser(String username, String email, boolean active, String password) {
        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setNombre("Test");
        usuario.setApellido("User");
        usuario.setActivo(active);
        usuario.setEmailVerificado(true);
        usuario.setPasswordHash(passwordEncoder.encode(password));
        return usuarioRepository.saveAndFlush(usuario);
    }

    private PasswordResetToken saveToken(
            Usuario usuario,
            String plainToken,
            OffsetDateTime expiresAt,
            OffsetDateTime usedAt
    ) {
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUsuario(usuario);
        resetToken.setTokenHash(passwordResetService.hashToken(plainToken));
        resetToken.setExpiresAt(expiresAt);
        resetToken.setUsedAt(usedAt);
        return passwordResetTokenRepository.saveAndFlush(resetToken);
    }
}

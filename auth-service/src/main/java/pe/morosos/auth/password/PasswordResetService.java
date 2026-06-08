package pe.morosos.auth.password;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import pe.morosos.auth.dto.ForgotPasswordRequest;
import pe.morosos.auth.dto.PasswordResetResponse;
import pe.morosos.auth.dto.ResetPasswordRequest;
import pe.morosos.auth.exception.PasswordResetException;
import pe.morosos.auth.password.entity.PasswordResetToken;
import pe.morosos.auth.password.repository.PasswordResetTokenRepository;
import pe.morosos.auth.service.AuthAuditService;
import pe.morosos.auth.session.AuthSecurityProperties;
import pe.morosos.auth.session.RequestThrottleService;
import pe.morosos.auth.user.entity.Usuario;
import pe.morosos.auth.user.repository.UsuarioRepository;

@Service
public class PasswordResetService {

    public static final String FORGOT_PASSWORD_MESSAGE =
            "Si los datos corresponden a una cuenta registrada, recibirás instrucciones para restablecer la contraseña.";
    public static final String RESET_PASSWORD_MESSAGE = "Contraseña restablecida correctamente.";
    private static final Logger LOGGER = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int TOKEN_RANDOM_BYTES = 32;
    private static final String TOKEN_ERROR_MESSAGE = "El token de restablecimiento es inválido o expiró.";
    private static final String PASSWORD_POLICY_MESSAGE =
            "La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo.";

    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AppMailProperties appMailProperties;
    private final PasswordResetEmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final AuthAuditService authAuditService;
    private final RequestThrottleService requestThrottleService;
    private final AuthSecurityProperties authSecurityProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(
            UsuarioRepository usuarioRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            AppMailProperties appMailProperties,
            PasswordResetEmailService emailService,
            PasswordEncoder passwordEncoder,
            AuthAuditService authAuditService,
            RequestThrottleService requestThrottleService,
            AuthSecurityProperties authSecurityProperties
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.appMailProperties = appMailProperties;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.authAuditService = authAuditService;
        this.requestThrottleService = requestThrottleService;
        this.authSecurityProperties = authSecurityProperties;
    }

    @Transactional
    public PasswordResetResponse requestPasswordReset(ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        String usernameOrEmail = resolveUsernameOrEmail(request);
        requestThrottleService.enforce("forgot-password", usernameOrEmail, authSecurityProperties.forgotPasswordRateLimitPerMinute(), httpRequest);
        if (!StringUtils.hasText(usernameOrEmail)) {
            return new PasswordResetResponse(FORGOT_PASSWORD_MESSAGE);
        }

        usuarioRepository.findByUsernameOrEmailIgnoreCase(usernameOrEmail.trim())
                .filter(Usuario::isActivo)
                .ifPresent(usuario -> createTokenAndNotify(usuario, httpRequest));

        return new PasswordResetResponse(FORGOT_PASSWORD_MESSAGE);
    }

    @Transactional
    public PasswordResetResponse resetPassword(ResetPasswordRequest request, HttpServletRequest httpRequest) {
        requestThrottleService.enforce("reset-password", "token", authSecurityProperties.resetPasswordRateLimitPerMinute(), httpRequest);
        String token = request.token().trim();
        validatePasswordFields(request, httpRequest);

        String tokenHash = hashToken(token);
        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> {
                    authAuditService.recordAuthEvent(
                            "PASSWORD_RESET_FAILED_INVALID_TOKEN",
                            null,
                            httpRequest,
                            "{\"reason\":\"TOKEN_NOT_FOUND\"}"
                    );
                    return new PasswordResetException("PASSWORD_RESET_TOKEN_INVALID", TOKEN_ERROR_MESSAGE);
                });

        if (passwordResetToken.getUsedAt() != null) {
            authAuditService.recordAuthEvent(
                    "PASSWORD_RESET_FAILED_INVALID_TOKEN",
                    passwordResetToken.getUsuario(),
                    httpRequest,
                    "{\"reason\":\"TOKEN_ALREADY_USED\"}"
            );
            throw new PasswordResetException("PASSWORD_RESET_TOKEN_INVALID", TOKEN_ERROR_MESSAGE);
        }

        if (passwordResetToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            authAuditService.recordAuthEvent(
                    "PASSWORD_RESET_FAILED_EXPIRED_TOKEN",
                    passwordResetToken.getUsuario(),
                    httpRequest,
                    "{\"reason\":\"TOKEN_EXPIRED\"}"
            );
            throw new PasswordResetException("PASSWORD_RESET_TOKEN_EXPIRED", TOKEN_ERROR_MESSAGE);
        }

        Usuario usuario = passwordResetToken.getUsuario();
        if (usuario == null || !usuario.isActivo()) {
            authAuditService.recordAuthEvent(
                    "PASSWORD_RESET_FAILED_INVALID_TOKEN",
                    usuario,
                    httpRequest,
                    "{\"reason\":\"USER_INACTIVE_OR_MISSING\"}"
            );
            throw new PasswordResetException("PASSWORD_RESET_TOKEN_INVALID", TOKEN_ERROR_MESSAGE);
        }

        usuario.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        usuario.setAuthVersion(usuario.getAuthVersion() + 1);
        usuario.setLockedUntil(null);
        passwordResetToken.setUsedAt(OffsetDateTime.now());
        passwordResetTokenRepository.markOtherActiveTokensAsUsed(usuario.getId(), passwordResetToken.getId(), passwordResetToken.getUsedAt());
        authAuditService.recordAuthEvent("PASSWORD_RESET_SUCCESS", usuario, httpRequest, "{\"method\":\"PASSWORD_RESET_TOKEN\"}");

        return new PasswordResetResponse(RESET_PASSWORD_MESSAGE);
    }

    private void createTokenAndNotify(Usuario usuario, HttpServletRequest httpRequest) {
        OffsetDateTime now = OffsetDateTime.now();
        passwordResetTokenRepository.markActiveTokensAsUsedByUsuarioId(usuario.getId(), now);

        String plainToken = generateToken();
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setUsuario(usuario);
        passwordResetToken.setTokenHash(hashToken(plainToken));
        passwordResetToken.setExpiresAt(now.plusMinutes(appMailProperties.passwordReset().tokenTtlMinutes()));
        passwordResetTokenRepository.save(passwordResetToken);

        authAuditService.recordAuthEvent("PASSWORD_RESET_REQUESTED", usuario, httpRequest, "{\"delivery\":\"EMAIL\"}");
        try {
            emailService.sendPasswordResetInstructions(
                    usuario,
                    usuario.getEmail(),
                    buildResetUrl(plainToken),
                    appMailProperties.passwordReset().tokenTtlMinutes()
            );
            authAuditService.recordAuthEvent("PASSWORD_RESET_EMAIL_SENT", usuario, httpRequest, "{\"delivery\":\"EMAIL\"}");
        } catch (PasswordResetEmailException exception) {
            LOGGER.error("Password reset email delivery failed. userId={} mailEnabled={}", usuario.getId(), appMailProperties.enabled(), exception);
            authAuditService.recordAuthEvent(
                    "PASSWORD_RESET_EMAIL_FAILED",
                    usuario,
                    httpRequest,
                    "{\"delivery\":\"EMAIL\",\"reason\":\"DELIVERY_FAILED\"}"
            );
        }
    }

    private String resolveUsernameOrEmail(ForgotPasswordRequest request) {
        if (request == null) {
            return null;
        }
        if (StringUtils.hasText(request.usernameOrEmail())) {
            return request.usernameOrEmail();
        }
        return request.email();
    }

    private void validatePasswordFields(ResetPasswordRequest request, HttpServletRequest httpRequest) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            authAuditService.recordAuthEvent(
                    "PASSWORD_RESET_FAILED_PASSWORD_POLICY",
                    null,
                    httpRequest,
                    "{\"reason\":\"PASSWORD_CONFIRMATION_MISMATCH\"}"
            );
            throw new PasswordResetException("PASSWORD_RESET_PASSWORD_MISMATCH", "Las contraseñas no coinciden.");
        }
        if (!isStrongEnough(request.newPassword())) {
            authAuditService.recordAuthEvent(
                    "PASSWORD_RESET_FAILED_PASSWORD_POLICY",
                    null,
                    httpRequest,
                    "{\"reason\":\"PASSWORD_POLICY\"}"
            );
            throw new PasswordResetException("PASSWORD_RESET_PASSWORD_POLICY", PASSWORD_POLICY_MESSAGE);
        }
    }

    private boolean isStrongEnough(String password) {
        if (!StringUtils.hasText(password) || password.trim().length() < 8) {
            return false;
        }
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSymbol = password.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));
        return hasUpper && hasLower && hasDigit && hasSymbol;
    }

    private String generateToken() {
        byte[] randomBytes = new byte[TOKEN_RANDOM_BYTES];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no está disponible.", exception);
        }
    }

    private String buildResetUrl(String token) {
        String baseUrl = appMailProperties.passwordReset().frontendResetUrl();
        String separator = baseUrl.contains("?") ? "&" : "?";
        return baseUrl + separator + "token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }
}

package pe.morosos.auth.session;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.auth.dto.AuthUserResponse;
import pe.morosos.auth.exception.AuthBusinessException;
import pe.morosos.auth.session.entity.RefreshToken;
import pe.morosos.auth.session.repository.RefreshTokenRepository;
import pe.morosos.auth.user.entity.Usuario;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthSecurityProperties authSecurityProperties;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, AuthSecurityProperties authSecurityProperties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.authSecurityProperties = authSecurityProperties;
    }

    @Transactional
    public IssuedRefreshToken issue(Usuario usuario, HttpServletRequest request) {
        String rawToken = UUID.randomUUID() + "." + UUID.randomUUID();
        RefreshToken token = new RefreshToken();
        token.setUsuario(usuario);
        token.setTokenHash(hash(rawToken));
        token.setExpiresAt(OffsetDateTime.now().plusDays(authSecurityProperties.refreshTokenDays()));
        token.setIp(resolveIp(request));
        token.setUserAgent(trim(request == null ? null : request.getHeader("User-Agent"), 512));
        refreshTokenRepository.save(token);
        return new IssuedRefreshToken(rawToken, token);
    }

    @Transactional
    public RefreshToken consumeForRefresh(String rawToken) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new AuthBusinessException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_INVALID", "Refresh token invalido."));
        if (token.getRevokedAt() != null) {
            throw new AuthBusinessException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_REVOKED", "Refresh token revocado.");
        }
        if (token.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new AuthBusinessException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_EXPIRED", "Refresh token expirado.");
        }
        return token;
    }

    @Transactional
    public void revoke(RefreshToken token) {
        token.setRevokedAt(OffsetDateTime.now());
    }

    @Transactional
    public void revokeAllForUser(Usuario usuario) {
        refreshTokenRepository.revokeActiveTokensByUsuarioId(usuario.getId(), OffsetDateTime.now());
    }

    public String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no disponible.", exception);
        }
    }

    private String resolveIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return trim(forwardedFor.split(",")[0].trim(), 80);
        }
        return trim(request.getRemoteAddr(), 80);
    }

    private String trim(String value, int maxLength) {
        if (value == null) return null;
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    public record IssuedRefreshToken(String rawToken, RefreshToken entity) {}
}

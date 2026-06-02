package pe.morosos.security;

import java.nio.charset.StandardCharsets;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtSecurityProperties(
        String issuer,
        String audience,
        String secret
) {
    public JwtSecurityProperties {
        if (!StringUtils.hasText(issuer)) {
            throw new IllegalStateException("app.security.jwt.issuer es obligatorio para validar JWT");
        }
        if (!StringUtils.hasText(audience)) {
            throw new IllegalStateException("app.security.jwt.audience es obligatorio para validar JWT");
        }
        if (!StringUtils.hasText(secret)) {
            throw new IllegalStateException("JWT_SECRET/app.security.jwt.secret es obligatorio para validar JWT HS256");
        }
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET/app.security.jwt.secret debe tener al menos 32 bytes para HS256");
        }
    }
}

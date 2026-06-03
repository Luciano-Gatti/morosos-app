package pe.morosos.auth.password;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.password-reset")
public record PasswordResetProperties(
        long tokenTtlMinutes,
        String frontendResetUrl
) {
}

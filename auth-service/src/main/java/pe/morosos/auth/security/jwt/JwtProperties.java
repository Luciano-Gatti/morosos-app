package pe.morosos.auth.security.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        String issuer,
        String audience,
        long accessTokenMinutes,
        String secret
) {
}

package pe.morosos.auth.password;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.mail")
public record AppMailProperties(
        boolean enabled,
        String from,
        String fromName,
        PasswordReset passwordReset
) {

    public AppMailProperties {
        if (passwordReset == null) {
            passwordReset = new PasswordReset(30, "http://localhost:5173/reset-password");
        }
    }

    public record PasswordReset(
            long tokenTtlMinutes,
            String frontendResetUrl
    ) {
    }
}

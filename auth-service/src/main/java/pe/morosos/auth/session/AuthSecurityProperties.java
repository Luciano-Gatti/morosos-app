package pe.morosos.auth.session;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public record AuthSecurityProperties(
        int maxFailedLoginAttempts,
        int lockMinutes,
        int loginRateLimitPerMinute,
        int forgotPasswordRateLimitPerMinute,
        int resetPasswordRateLimitPerMinute,
        int refreshRateLimitPerMinute,
        long refreshTokenDays
) {
    public AuthSecurityProperties {
        maxFailedLoginAttempts = maxFailedLoginAttempts <= 0 ? 5 : maxFailedLoginAttempts;
        lockMinutes = lockMinutes <= 0 ? 15 : lockMinutes;
        loginRateLimitPerMinute = loginRateLimitPerMinute <= 0 ? 10 : loginRateLimitPerMinute;
        forgotPasswordRateLimitPerMinute = forgotPasswordRateLimitPerMinute <= 0 ? 5 : forgotPasswordRateLimitPerMinute;
        resetPasswordRateLimitPerMinute = resetPasswordRateLimitPerMinute <= 0 ? 10 : resetPasswordRateLimitPerMinute;
        refreshRateLimitPerMinute = refreshRateLimitPerMinute <= 0 ? 30 : refreshRateLimitPerMinute;
        refreshTokenDays = refreshTokenDays <= 0 ? 7 : refreshTokenDays;
    }
}

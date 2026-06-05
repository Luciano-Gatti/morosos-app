package pe.morosos.auth.password;

import jakarta.annotation.PostConstruct;
import java.util.Arrays;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class MailConfigurationValidator {

    private final AppMailProperties appMailProperties;
    private final MailProperties mailProperties;
    private final Environment environment;

    public MailConfigurationValidator(
            AppMailProperties appMailProperties,
            MailProperties mailProperties,
            Environment environment
    ) {
        this.appMailProperties = appMailProperties;
        this.mailProperties = mailProperties;
        this.environment = environment;
    }

    @PostConstruct
    void validate() {
        if (!appMailProperties.enabled() || !isProdProfile()) {
            return;
        }
        if (!StringUtils.hasText(mailProperties.getHost())) {
            throw new IllegalStateException("AUTH_MAIL_HOST debe configurarse cuando AUTH_MAIL_ENABLED=true en producción.");
        }
        if (mailProperties.getPort() == null || mailProperties.getPort() <= 0) {
            throw new IllegalStateException("AUTH_MAIL_PORT debe configurarse con un puerto válido cuando AUTH_MAIL_ENABLED=true en producción.");
        }
        if (!StringUtils.hasText(appMailProperties.from())) {
            throw new IllegalStateException("AUTH_MAIL_FROM debe configurarse cuando AUTH_MAIL_ENABLED=true en producción.");
        }
        if (isSmtpAuthEnabled()) {
            if (!StringUtils.hasText(mailProperties.getUsername())) {
                throw new IllegalStateException("AUTH_MAIL_USERNAME debe configurarse cuando AUTH_MAIL_SMTP_AUTH=true en producción.");
            }
            if (!StringUtils.hasText(mailProperties.getPassword())) {
                throw new IllegalStateException("AUTH_MAIL_PASSWORD debe configurarse cuando AUTH_MAIL_SMTP_AUTH=true en producción.");
            }
        }
    }

    private boolean isProdProfile() {
        return Arrays.stream(environment.getActiveProfiles()).anyMatch(profile -> "prod".equalsIgnoreCase(profile));
    }

    private boolean isSmtpAuthEnabled() {
        Object value = mailProperties.getProperties().get("mail.smtp.auth");
        return value == null || Boolean.parseBoolean(value.toString());
    }
}

package pe.morosos.auth.password;

import java.util.Arrays;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import pe.morosos.auth.user.entity.Usuario;

@Service
public class LocalPasswordResetNotificationService implements PasswordResetNotificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(LocalPasswordResetNotificationService.class);

    private final Environment environment;

    public LocalPasswordResetNotificationService(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void sendPasswordResetInstructions(Usuario usuario, String resetUrl) {
        if (isLocalOrDevProfile()) {
            LOGGER.info("Password reset link generated for local/dev testing. userId={} resetUrl={}", usuario.getId(), resetUrl);
            return;
        }
        LOGGER.info("Password reset instructions queued. userId={}. SMTP delivery is pending implementation.", usuario.getId());
    }

    private boolean isLocalOrDevProfile() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "local".equalsIgnoreCase(profile) || "dev".equalsIgnoreCase(profile));
    }
}

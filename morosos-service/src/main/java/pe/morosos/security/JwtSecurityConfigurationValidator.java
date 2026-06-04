package pe.morosos.security;

import jakarta.annotation.PostConstruct;
import java.util.Arrays;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class JwtSecurityConfigurationValidator {

    private static final String LOCAL_DEV_SECRET = "3HugO1JOjAKmVZYTMKO6NqWGqvTJ5xO41wiBWyqnuAnDgwo2RrUVqpOJ4I4kWjzyMfBLTWUjw3UV0VeXkjWOpA";
    private static final String LOCAL_RUN_HINT = "Para desarrollo local active explícitamente el perfil local "
            + "(SPRING_PROFILES_ACTIVE=local o -Dspring-boot.run.profiles=local) "
            + "o configure JWT_SECRET/app.security.jwt.secret con una clave de al menos 32 bytes.";

    private final JwtSecurityProperties properties;
    private final Environment environment;

    public JwtSecurityConfigurationValidator(JwtSecurityProperties properties, Environment environment) {
        this.properties = properties;
        this.environment = environment;
    }

    @PostConstruct
    void validateKnownFallbackSecretProfile() {
        if (LOCAL_DEV_SECRET.equals(properties.secret()) && !isLocalOrDevActiveProfile()) {
            throw new IllegalStateException(
                    "JWT_SECRET/app.security.jwt.secret no puede usar el fallback conocido de desarrollo "
                            + "fuera de perfiles activos local/dev. " + activeProfilesHint() + " " + LOCAL_RUN_HINT
            );
        }
    }

    private String activeProfilesHint() {
        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles.length == 0) {
            return "No hay perfiles activos.";
        }
        return "Perfiles activos: " + Arrays.toString(activeProfiles) + ".";
    }

    private boolean isLocalOrDevActiveProfile() {
        boolean localOrDevActive = false;
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile)) {
                return false;
            }
            if ("local".equalsIgnoreCase(profile) || "dev".equalsIgnoreCase(profile)) {
                localOrDevActive = true;
            }
        }
        return localOrDevActive;
    }
}

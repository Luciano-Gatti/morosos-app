package pe.morosos.auth.seed;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.seed.admin")
public record AdminSeedProperties(
        boolean enabled,
        String username,
        String email,
        String password,
        String nombre,
        String apellido
) {
}

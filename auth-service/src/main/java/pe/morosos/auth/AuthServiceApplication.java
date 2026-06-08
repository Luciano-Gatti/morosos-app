package pe.morosos.auth;

import pe.morosos.auth.config.CorsProperties;
import pe.morosos.auth.password.AppMailProperties;
import pe.morosos.auth.security.jwt.JwtProperties;
import pe.morosos.auth.session.AuthSecurityProperties;
import pe.morosos.auth.seed.AdminSeedProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableConfigurationProperties({CorsProperties.class, JwtProperties.class, AdminSeedProperties.class, AppMailProperties.class, AuthSecurityProperties.class})
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}

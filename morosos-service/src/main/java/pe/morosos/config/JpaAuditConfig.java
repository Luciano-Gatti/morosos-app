package pe.morosos.config;

import java.util.Optional;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class JpaAuditConfig {

    public static final String TECHNICAL_ACTOR = "SYSTEM_MOROSOS";

    @Bean
    public AuditorAware<String> auditorAware() {
        return () -> Optional.of(TECHNICAL_ACTOR);
    }
}

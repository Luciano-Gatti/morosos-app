package pe.morosos.security;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class JwtSecurityConfigurationValidatorTest {

    private static final String LOCAL_DEV_SECRET = "3HugO1JOjAKmVZYTMKO6NqWGqvTJ5xO41wiBWyqnuAnDgwo2RrUVqpOJ4I4kWjzyMfBLTWUjw3UV0VeXkjWOpA";
    private static final String SAFE_SECRET = "safe_secret_32_bytes_minimum_value";

    @Test
    void allowsKnownFallbackSecretWithLocalActiveProfile() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("local");
        JwtSecurityConfigurationValidator validator = validator(LOCAL_DEV_SECRET, environment);

        assertThatCode(validator::validateKnownFallbackSecretProfile).doesNotThrowAnyException();
    }

    @Test
    void rejectsKnownFallbackSecretWithoutActiveLocalOrDevProfile() {
        MockEnvironment environment = new MockEnvironment();
        environment.setDefaultProfiles("local");
        JwtSecurityConfigurationValidator validator = validator(LOCAL_DEV_SECRET, environment);

        assertThatThrownBy(validator::validateKnownFallbackSecretProfile)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("fallback conocido de desarrollo")
                .hasMessageContaining("No hay perfiles activos");
    }

    @Test
    void rejectsKnownFallbackSecretWhenProdIsActive() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("local", "prod");
        JwtSecurityConfigurationValidator validator = validator(LOCAL_DEV_SECRET, environment);

        assertThatThrownBy(validator::validateKnownFallbackSecretProfile)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("fallback conocido de desarrollo")
                .hasMessageContaining("prod");
    }

    @Test
    void allowsExplicitNonFallbackSecretWithoutActiveProfiles() {
        JwtSecurityConfigurationValidator validator = validator(SAFE_SECRET, new MockEnvironment());

        assertThatCode(validator::validateKnownFallbackSecretProfile).doesNotThrowAnyException();
    }

    private JwtSecurityConfigurationValidator validator(String secret, MockEnvironment environment) {
        return new JwtSecurityConfigurationValidator(
                new JwtSecurityProperties("http://localhost:8080", "gestion-aosc", secret),
                environment
        );
    }
}

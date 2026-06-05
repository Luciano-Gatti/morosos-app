package pe.morosos.auth.security.jwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import pe.morosos.auth.dto.AuthUserResponse;
import pe.morosos.auth.exception.JwtAuthenticationException;
import pe.morosos.auth.security.AuthPrincipal;

class JwtServiceTest {

    private static final String ISSUER = "http://localhost:8080";
    private static final String AUDIENCE = "gestion-aosc";
    private static final String SAFE_SECRET = "test-secret-with-at-least-32-bytes-long";
    private static final String LONG_SECRET = "test-secret-with-at-least-64-bytes-long-for-hs384-negative-case";
    private static final String LOCAL_DEV_SECRET = "3HugO1JOjAKmVZYTMKO6NqWGqvTJ5xO41wiBWyqnuAnDgwo2RrUVqpOJ4I4kWjzyMfBLTWUjw3UV0VeXkjWOpA";

    @Test
    void validateConfigurationRejectsEmptySecretWithoutActiveProfiles() {
        MockEnvironment environment = new MockEnvironment();
        JwtService jwtService = new JwtService(jwtProperties(""), environment);

        assertThatThrownBy(jwtService::validateConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET debe estar configurado")
                .hasMessageContaining("No hay perfiles activos")
                .hasMessageContaining("SPRING_PROFILES_ACTIVE=local");
    }

    @Test
    void validateConfigurationRejectsKnownFallbackSecretWithoutActiveProfiles() {
        MockEnvironment environment = new MockEnvironment();
        JwtService jwtService = new JwtService(jwtProperties(LOCAL_DEV_SECRET), environment);

        assertThatThrownBy(jwtService::validateConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("fallback conocido de desarrollo")
                .hasMessageContaining("No hay perfiles activos")
                .hasMessageContaining("SPRING_PROFILES_ACTIVE=local");
    }

    @Test
    void validateConfigurationDoesNotUseDefaultProfilesForFallbackSecret() {
        MockEnvironment environment = new MockEnvironment();
        environment.setDefaultProfiles("local");
        JwtService jwtService = new JwtService(jwtProperties(LOCAL_DEV_SECRET), environment);

        assertThatThrownBy(jwtService::validateConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("fallback conocido de desarrollo")
                .hasMessageContaining("No hay perfiles activos")
                .hasMessageContaining("SPRING_PROFILES_ACTIVE=local");
    }

    @Test
    void validateConfigurationAllowsKnownFallbackSecretWithLocalActiveProfile() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("local");
        JwtService jwtService = new JwtService(jwtProperties(LOCAL_DEV_SECRET), environment);

        jwtService.validateConfiguration();

        String token = jwtService.generateAccessToken(user());
        AuthPrincipal principal = jwtService.validateAccessToken(token);
        assertThat(principal.permissions()).containsExactly("INMUEBLES_VER_LISTADO");
    }

    @Test
    void validateConfigurationAllowsKnownFallbackSecretWithDevActiveProfile() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("dev");
        JwtService jwtService = new JwtService(jwtProperties(LOCAL_DEV_SECRET), environment);

        jwtService.validateConfiguration();

        String token = jwtService.generateAccessToken(user());
        AuthPrincipal principal = jwtService.validateAccessToken(token);
        assertThat(principal.roles()).containsExactly("ADMIN");
    }

    @Test
    void validateConfigurationAllowsEmptySecretFallbackWithLocalActiveProfile() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("local");
        JwtService jwtService = new JwtService(jwtProperties(""), environment);

        jwtService.validateConfiguration();

        String token = jwtService.generateAccessToken(user());
        AuthPrincipal principal = jwtService.validateAccessToken(token);
        assertThat(principal.permissions()).containsExactly("INMUEBLES_VER_LISTADO");
    }

    @Test
    void validateConfigurationRejectsFallbackSecretWhenProdIsActive() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        JwtService jwtService = new JwtService(jwtProperties(LOCAL_DEV_SECRET), environment);

        assertThatThrownBy(jwtService::validateConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("fallback conocido de desarrollo")
                .hasMessageContaining("Perfiles activos: [prod]")
                .hasMessageContaining("SPRING_PROFILES_ACTIVE=local");
    }

    @Test
    void validateConfigurationRejectsEmptySecretWhenProdIsActive() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        JwtService jwtService = new JwtService(jwtProperties(""), environment);

        assertThatThrownBy(jwtService::validateConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET debe estar configurado")
                .hasMessageContaining("Perfiles activos: [prod]")
                .hasMessageContaining("SPRING_PROFILES_ACTIVE=local");
    }

    @Test
    void validateConfigurationRejectsSecretShorterThan32Bytes() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("test");
        JwtService jwtService = new JwtService(jwtProperties("short-secret"), environment);

        assertThatThrownBy(jwtService::validateConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET debe estar configurado")
                .hasMessageContaining("Perfiles activos: [test]")
                .hasMessageContaining("SPRING_PROFILES_ACTIVE=local");
    }

    @Test
    void validateAccessTokenRejectsAlgorithmsDifferentFromHs256() throws JOSEException {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("test");
        JwtService jwtService = new JwtService(jwtProperties(LONG_SECRET), environment);
        jwtService.validateConfiguration();

        String token = signedToken(JWSAlgorithm.HS384, LONG_SECRET);

        assertThatThrownBy(() -> jwtService.validateAccessToken(token))
                .isInstanceOf(JwtAuthenticationException.class)
                .hasMessage("Token inválido.");
    }

    @Test
    void validateAccessTokenAcceptsHs256SignedToken() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("test");
        JwtService jwtService = new JwtService(jwtProperties(SAFE_SECRET), environment);
        jwtService.validateConfiguration();

        String token = jwtService.generateAccessToken(user());

        AuthPrincipal principal = jwtService.validateAccessToken(token);

        assertThat(principal.username()).isEqualTo("admin");
        assertThat(principal.roles()).containsExactly("ADMIN");
        assertThat(principal.permissions()).containsExactly("INMUEBLES_VER_LISTADO");
    }

    private JwtProperties jwtProperties(String secret) {
        return new JwtProperties(ISSUER, AUDIENCE, 15, secret);
    }

    private AuthUserResponse user() {
        return new AuthUserResponse(
                UUID.randomUUID(),
                "admin",
                "admin@local.test",
                "Administrador",
                "Local",
                List.of("ADMIN"),
                List.of("INMUEBLES_VER_LISTADO")
        );
    }

    private String signedToken(JWSAlgorithm algorithm, String secret) throws JOSEException {
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(ISSUER)
                .audience(AUDIENCE)
                .subject(UUID.randomUUID().toString())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(900)))
                .jwtID(UUID.randomUUID().toString())
                .claim("username", "admin")
                .claim("email", "admin@local.test")
                .claim("roles", List.of("ADMIN"))
                .claim("permissions", List.of("INMUEBLES_VER_LISTADO"))
                .build();
        SignedJWT signedJWT = new SignedJWT(new JWSHeader(algorithm), claims);
        signedJWT.sign(new MACSigner(secret));
        return signedJWT.serialize();
    }
}

package pe.morosos.auth.security.jwt;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import pe.morosos.auth.dto.AuthUserResponse;
import pe.morosos.auth.exception.JwtAuthenticationException;
import pe.morosos.auth.security.AuthPrincipal;

@Service
public class JwtService {

    private static final String LOCAL_DEV_SECRET = "3HugO1JOjAKmVZYTMKO6NqWGqvTJ5xO41wiBWyqnuAnDgwo2RrUVqpOJ4I4kWjzyMfBLTWUjw3UV0VeXkjWOpA";
    private static final int MIN_HS256_SECRET_BYTES = 32;
    private static final String LOCAL_RUN_HINT = "Para desarrollo local active el perfil local "
            + "(SPRING_PROFILES_ACTIVE=local o -Dspring-boot.run.profiles=local) "
            + "o configure JWT_SECRET/app.jwt.secret con una clave de al menos 32 bytes.";

    private final JwtProperties properties;
    private final Environment environment;
    private final Clock clock;
    private byte[] secretBytes;

    public JwtService(JwtProperties properties, Environment environment) {
        this.properties = properties;
        this.environment = environment;
        this.clock = Clock.systemUTC();
    }

    @PostConstruct
    void validateConfiguration() {
        String secret = properties.secret();
        boolean localOrDevActiveProfile = isLocalOrDevActiveProfile();
        if (!StringUtils.hasText(secret) && localOrDevActiveProfile) {
            secret = LOCAL_DEV_SECRET;
        }

        if (LOCAL_DEV_SECRET.equals(secret) && !localOrDevActiveProfile) {
            throw new IllegalStateException(
                    "JWT_SECRET no puede usar el fallback conocido de desarrollo fuera de perfiles activos local/dev. "
                            + activeProfilesHint() + " " + LOCAL_RUN_HINT
            );
        }

        if (!StringUtils.hasText(secret) || secret.getBytes(StandardCharsets.UTF_8).length < MIN_HS256_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET debe estar configurado con al menos 32 bytes para HS256. "
                            + "Solo local/dev permite un fallback seguro de desarrollo. "
                            + activeProfilesHint() + " " + LOCAL_RUN_HINT
            );
        }
        if (!StringUtils.hasText(properties.issuer())) {
            throw new IllegalStateException("JWT issuer no puede estar vacío.");
        }
        if (!StringUtils.hasText(properties.audience())) {
            throw new IllegalStateException("JWT audience no puede estar vacío.");
        }
        if (properties.accessTokenMinutes() <= 0) {
            throw new IllegalStateException("JWT accessTokenMinutes debe ser mayor a cero.");
        }
        secretBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String generateAccessToken(AuthUserResponse user) {
        Instant now = clock.instant();
        Instant expiresAt = now.plus(Duration.ofMinutes(properties.accessTokenMinutes()));
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(properties.issuer())
                .audience(properties.audience())
                .subject(user.id().toString())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(expiresAt))
                .jwtID(UUID.randomUUID().toString())
                .claim("userId", user.id().toString())
                .claim("username", user.username())
                .claim("email", user.email())
                .claim("roles", user.roles())
                .claim("permissions", user.permissions())
                .claim("authVersion", user.authVersion())
                .claim("authProvider", "LOCAL")
                .build();

        SignedJWT signedJwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        try {
            signedJwt.sign(new MACSigner(secretBytes));
        } catch (JOSEException exception) {
            throw new IllegalStateException("No se pudo firmar el JWT.", exception);
        }
        return signedJwt.serialize();
    }

    public AuthPrincipal validateAccessToken(String token) {
        try {
            SignedJWT signedJwt = SignedJWT.parse(token);
            if (!JWSAlgorithm.HS256.equals(signedJwt.getHeader().getAlgorithm())) {
                throw new JwtAuthenticationException("AUTH_UNAUTHORIZED", "Token inválido.");
            }
            if (!signedJwt.verify(new MACVerifier(secretBytes))) {
                throw new JwtAuthenticationException("AUTH_UNAUTHORIZED", "Token inválido.");
            }
            JWTClaimsSet claims = signedJwt.getJWTClaimsSet();
            validateClaims(claims);
            return new AuthPrincipal(
                    UUID.fromString(claims.getSubject()),
                    claims.getStringClaim("username"),
                    claims.getStringClaim("email"),
                    getStringListClaim(claims, "roles"),
                    getStringListClaim(claims, "permissions"),
                    getLongClaim(claims, "authVersion")
            );
        } catch (JwtAuthenticationException exception) {
            throw exception;
        } catch (ParseException | JOSEException | IllegalArgumentException exception) {
            throw new JwtAuthenticationException("AUTH_UNAUTHORIZED", "Token inválido.");
        }
    }

    public long accessTokenSeconds() {
        return Duration.ofMinutes(properties.accessTokenMinutes()).toSeconds();
    }

    private void validateClaims(JWTClaimsSet claims) {
        Instant now = clock.instant();
        Date expirationTime = claims.getExpirationTime();
        if (expirationTime == null || expirationTime.toInstant().isBefore(now)) {
            throw new JwtAuthenticationException("AUTH_TOKEN_EXPIRED", "Token expirado.");
        }
        if (!properties.issuer().equals(claims.getIssuer())) {
            throw new JwtAuthenticationException("AUTH_UNAUTHORIZED", "Token inválido.");
        }
        if (claims.getAudience() == null || !claims.getAudience().contains(properties.audience())) {
            throw new JwtAuthenticationException("AUTH_UNAUTHORIZED", "Token inválido.");
        }
        if (!StringUtils.hasText(claims.getSubject())) {
            throw new JwtAuthenticationException("AUTH_UNAUTHORIZED", "Token inválido.");
        }
    }

    private List<String> getStringListClaim(JWTClaimsSet claims, String claimName) throws ParseException {
        List<String> values = claims.getStringListClaim(claimName);
        return values == null ? List.of() : List.copyOf(values);
    }

    private long getLongClaim(JWTClaimsSet claims, String claimName) {
        Object value = claims.getClaim(claimName);
        if (value instanceof Number number) {
            return number.longValue();
        }
        return 0L;
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

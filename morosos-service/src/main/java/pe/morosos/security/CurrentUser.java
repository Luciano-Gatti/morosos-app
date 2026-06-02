package pe.morosos.security;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    public Optional<Jwt> jwt() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return Optional.empty();
        }
        return Optional.of(jwt);
    }

    public Optional<UUID> userId() {
        return jwt().map(token -> token.getClaimAsString("userId")).filter(value -> !value.isBlank()).map(UUID::fromString);
    }

    public Optional<String> username() {
        return jwt().map(token -> token.getClaimAsString("username")).filter(value -> !value.isBlank());
    }

    public Optional<String> email() {
        return jwt().map(token -> token.getClaimAsString("email")).filter(value -> !value.isBlank());
    }

    public List<String> roles() {
        return jwt().map(token -> token.getClaimAsStringList("roles")).orElse(List.of());
    }

    public List<String> permissions() {
        return jwt().map(token -> token.getClaimAsStringList("permissions")).orElse(List.of());
    }

    public Optional<String> jti() {
        return jwt().map(token -> token.getId()).filter(value -> !value.isBlank());
    }
}

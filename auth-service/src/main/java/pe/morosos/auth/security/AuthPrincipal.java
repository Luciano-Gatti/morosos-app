package pe.morosos.auth.security;

import java.util.List;
import java.util.UUID;

public record AuthPrincipal(
        UUID userId,
        String username,
        String email,
        List<String> roles,
        List<String> permissions,
        long authVersion
) {
}

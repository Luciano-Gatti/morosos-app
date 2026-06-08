package pe.morosos.auth.dto;

import java.util.List;
import java.util.UUID;

public record AuthUserResponse(
        UUID id,
        String username,
        String email,
        String nombre,
        String apellido,
        List<String> roles,
        List<String> permissions,
        long authVersion
) {
}

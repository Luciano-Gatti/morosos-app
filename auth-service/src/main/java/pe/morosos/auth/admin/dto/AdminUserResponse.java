package pe.morosos.auth.admin.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import pe.morosos.auth.user.entity.EstadoUsuario;

public record AdminUserResponse(
        UUID id,
        String username,
        String email,
        String nombre,
        String apellido,
        boolean activo,
        EstadoUsuario estado,
        boolean emailVerificado,
        List<String> roles,
        List<String> permissions,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}

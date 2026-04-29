package pe.morosos.grupo.dto;

import java.time.Instant;
import java.util.UUID;

public record GrupoResponse(
        UUID id,
        String codigo,
        String nombre,
        boolean activo,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt
) {
}

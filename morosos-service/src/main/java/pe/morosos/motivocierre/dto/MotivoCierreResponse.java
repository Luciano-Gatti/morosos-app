package pe.morosos.motivocierre.dto;

import java.time.Instant;
import java.util.UUID;

public record MotivoCierreResponse(
        UUID id,
        String codigo,
        String nombre,
        boolean isSystem,
        boolean activo,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt
) {
}

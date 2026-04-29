package pe.morosos.distrito.dto;

import java.time.Instant;
import java.util.UUID;

public record DistritoResponse(
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

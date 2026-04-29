package pe.morosos.parametro.dto;

import java.time.Instant;
import java.util.UUID;

public record ParametroSeguimientoResponse(
        UUID id,
        String codigo,
        String valor,
        String descripcion,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt
) {
}

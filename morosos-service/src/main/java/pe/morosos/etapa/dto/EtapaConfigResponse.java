package pe.morosos.etapa.dto;

import java.time.Instant;
import java.util.UUID;

public record EtapaConfigResponse(
        UUID id,
        String codigo,
        String nombre,
        Integer orden,
        boolean activo,
        boolean esFinal,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt
) {
}

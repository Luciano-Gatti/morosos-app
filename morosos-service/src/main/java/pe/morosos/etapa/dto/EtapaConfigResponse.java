package pe.morosos.etapa.dto;

import java.time.Instant;
import java.util.UUID;

public record EtapaConfigResponse(
        UUID id,
        String codigo,
        String nombre,
        String descripcion,
        Integer orden,
        boolean activo,
        boolean esFinal,
        long procesosAsociados,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt
) {
}

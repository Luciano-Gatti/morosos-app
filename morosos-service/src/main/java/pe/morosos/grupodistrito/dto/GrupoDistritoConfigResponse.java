package pe.morosos.grupodistrito.dto;

import java.time.Instant;
import java.util.UUID;

public record GrupoDistritoConfigResponse(
        UUID id,
        UUID grupoId,
        String grupoCodigo,
        UUID distritoId,
        String distritoCodigo,
        boolean seguimientoHabilitado,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt
) {
}

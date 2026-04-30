package pe.morosos.grupodistrito.dto;

import java.time.Instant;
import java.util.UUID;

public record GrupoDistritoConfigResponse(
        UUID id,
        UUID grupoId,
        String grupoCodigo,
        String grupoNombre,
        UUID distritoId,
        String distritoCodigo,
        String distritoNombre,
        boolean seguimientoHabilitado,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt
) {
}

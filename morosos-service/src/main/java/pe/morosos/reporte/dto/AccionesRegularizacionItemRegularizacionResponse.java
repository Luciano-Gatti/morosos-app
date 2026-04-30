package pe.morosos.reporte.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AccionesRegularizacionItemRegularizacionResponse(
        OffsetDateTime fecha,
        String cuenta,
        String titular,
        UUID inmuebleId,
        UUID casoId,
        UUID grupoId,
        String grupoNombre,
        UUID distritoId,
        String distritoNombre,
        UUID actorId,
        String observacion
) {}

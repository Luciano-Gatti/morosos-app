package pe.morosos.reporte.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AccionesRegularizacionItemRegularizacionResponse(
        OffsetDateTime fecha,
        String cuenta,
        String titular,
        String grupo,
        String distrito,
        UUID actorId,
        String observacion
) {}

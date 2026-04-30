package pe.morosos.reporte.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AccionesFechasDetalleResponse(
        OffsetDateTime fecha,
        String tipoAccion,
        String cuenta,
        String titular,
        String grupo,
        String distrito,
        String etapaOrigen,
        String etapaDestino,
        UUID actorId,
        String observacion
) {}

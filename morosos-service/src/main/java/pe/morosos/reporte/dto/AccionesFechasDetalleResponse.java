package pe.morosos.reporte.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AccionesFechasDetalleResponse(
        OffsetDateTime fecha,
        String tipoAccion,
        String tipoAccionLabel,
        String cuenta,
        String titular,
        UUID inmuebleId,
        UUID casoId,
        UUID grupoId,
        String grupoNombre,
        UUID distritoId,
        String distritoNombre,
        UUID etapaOrigenId,
        String etapaOrigen,
        UUID etapaDestinoId,
        String etapaDestino,
        UUID actorId,
        String observacion
) {}

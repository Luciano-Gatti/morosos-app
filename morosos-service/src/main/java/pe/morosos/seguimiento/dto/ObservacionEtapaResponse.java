package pe.morosos.seguimiento.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ObservacionEtapaResponse(
        UUID id,
        UUID casoSeguimientoId,
        String tipoEvento,
        UUID etapaId,
        String etapaNombre,
        OffsetDateTime fechaEvento,
        String observacion,
        String createdBy
) {}

package pe.morosos.reporte.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AccionesRegularizacionItemPlanPagoResponse(
        OffsetDateTime fecha,
        String cuenta,
        String titular,
        UUID inmuebleId,
        UUID casoId,
        UUID grupoId,
        String grupoNombre,
        UUID distritoId,
        String distritoNombre,
        Integer cantidadCuotas,
        LocalDate fechaVencimientoPrimeraCuota,
        UUID actorId,
        String observacion
) {}

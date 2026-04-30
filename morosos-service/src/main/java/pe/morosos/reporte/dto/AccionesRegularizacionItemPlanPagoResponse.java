package pe.morosos.reporte.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AccionesRegularizacionItemPlanPagoResponse(
        OffsetDateTime fecha,
        String cuenta,
        String titular,
        String grupo,
        String distrito,
        Integer cantidadCuotas,
        LocalDate fechaVencimientoPrimeraCuota,
        UUID actorId,
        String observacion
) {}

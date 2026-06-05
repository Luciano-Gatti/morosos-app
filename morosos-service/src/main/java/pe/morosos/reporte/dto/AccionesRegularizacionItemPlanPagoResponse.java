package pe.morosos.reporte.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.math.BigDecimal;
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
        BigDecimal montoTotalPlan,
        Integer cantidadCuotas,
        BigDecimal valorCuota,
        Integer cuotasPagadas,
        BigDecimal montoPagado,
        Integer cuotasPendientes,
        BigDecimal montoPendiente,
        BigDecimal saldoPendiente,
        LocalDate fechaVencimientoPrimeraCuota,
        LocalDate fechaVencimientoFinal,
        String estado,
        UUID actorId,
        String observacion,
        String usuarioResponsable
) {}

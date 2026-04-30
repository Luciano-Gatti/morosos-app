package pe.morosos.reporte.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AccionesRegularizacionItemCompromisoResponse(
        LocalDate fechaDesde,
        LocalDate fechaHasta,
        String cuenta,
        String titular,
        String grupo,
        String distrito,
        String estado,
        BigDecimal montoComprometido,
        UUID actorId,
        String observacion
) {}

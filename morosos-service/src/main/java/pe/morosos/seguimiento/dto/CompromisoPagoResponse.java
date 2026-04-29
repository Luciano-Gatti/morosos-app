package pe.morosos.seguimiento.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CompromisoPagoResponse(
        UUID id,
        UUID casoSeguimientoId,
        LocalDate fechaDesde,
        LocalDate fechaHasta,
        BigDecimal montoComprometido,
        String estado,
        String observacion
) {
}

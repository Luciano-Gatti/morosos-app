package pe.morosos.seguimiento.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record RegistrarCompromisosBulkRequest(
        @NotEmpty List<@NotNull UUID> casoSeguimientoIds,
        @NotNull LocalDate fechaDesde,
        @NotNull LocalDate fechaHasta,
        BigDecimal montoComprometido,
        String observacion
) {
    @AssertTrue(message = "fechaHasta debe ser mayor o igual a fechaDesde")
    public boolean isRangoFechasValido() {
        if (fechaDesde == null || fechaHasta == null) {
            return true;
        }
        return !fechaHasta.isBefore(fechaDesde);
    }
}

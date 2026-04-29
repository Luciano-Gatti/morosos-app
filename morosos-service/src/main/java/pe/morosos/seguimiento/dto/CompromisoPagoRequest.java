package pe.morosos.seguimiento.dto;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CompromisoPagoRequest(
        @NotNull UUID casoSeguimientoId,
        @NotNull LocalDate fechaDesde,
        @NotNull LocalDate fechaHasta,
        @NotNull @DecimalMin(value = "0.00", inclusive = false) BigDecimal montoComprometido,
        String observacion
) {}

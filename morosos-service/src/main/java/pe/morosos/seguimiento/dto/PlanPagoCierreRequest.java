package pe.morosos.seguimiento.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PlanPagoCierreRequest(
        @NotNull @DecimalMin(value = "0.01") BigDecimal montoTotalPlan,
        @NotNull @Min(1) Integer cantidadTotalCuotas,
        @NotNull @Min(0) Integer cantidadCuotasQuePagaAhora,
        @NotNull LocalDate fechaVencimientoPrimeraCuota
) {}

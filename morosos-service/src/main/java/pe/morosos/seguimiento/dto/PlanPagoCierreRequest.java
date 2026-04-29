package pe.morosos.seguimiento.dto;
import jakarta.validation.constraints.NotNull;import java.time.LocalDate;
public record PlanPagoCierreRequest(@NotNull Integer cantidadCuotas,@NotNull LocalDate fechaVencimientoPrimeraCuota) {}

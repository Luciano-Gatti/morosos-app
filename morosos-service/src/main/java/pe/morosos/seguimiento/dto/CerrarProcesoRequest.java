package pe.morosos.seguimiento.dto;
import java.math.BigDecimal;
import jakarta.validation.constraints.NotBlank;import jakarta.validation.constraints.NotNull;import java.util.UUID;
public record CerrarProcesoRequest(@NotNull UUID casoSeguimientoId,@NotBlank String motivoCodigo,String observacion, BigDecimal montoAbonado, PlanPagoCierreRequest planPago,CambioParametroCierreRequest cambioParametro) {}

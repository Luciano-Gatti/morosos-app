package pe.morosos.seguimiento.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CerrarProcesosBulkRequest(
        @NotEmpty List<@NotNull UUID> casoSeguimientoIds,
        @NotBlank String motivoCodigo,
        String observacion,
        @Valid PlanPagoCierreRequest planPago,
        @Valid CambioParametroCierreRequest cambioParametro
) {
    @AssertTrue(message = "planPago es requerido cuando motivoCodigo es PLAN_DE_PAGO")
    public boolean isPlanPagoValido() {
        if (!"PLAN_DE_PAGO".equalsIgnoreCase(motivoCodigo)) {
            return true;
        }
        return planPago != null;
    }

    @AssertTrue(message = "cambioParametro es requerido cuando motivoCodigo es CAMBIO_PARAMETRO")
    public boolean isCambioParametroValido() {
        if (!"CAMBIO_PARAMETRO".equalsIgnoreCase(motivoCodigo)) {
            return true;
        }
        return cambioParametro != null;
    }
}

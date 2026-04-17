package com.tuorg.morososcontrol.estadodeuda.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record EstadoDeudaRequest(
        @NotNull UUID inmuebleId,
        @NotNull @Min(0) Integer cuotasAdeudadas,
        @NotNull @DecimalMin("0.00") BigDecimal montoAdeudado
) {
}

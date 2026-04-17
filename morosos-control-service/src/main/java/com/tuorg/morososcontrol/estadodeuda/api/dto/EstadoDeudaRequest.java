package com.tuorg.morososcontrol.estadodeuda.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

@Schema(description = "Datos necesarios para registrar o actualizar el estado de deuda de un inmueble")
public record EstadoDeudaRequest(
        @Schema(description = "Identificador del inmueble", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
        @NotNull UUID inmuebleId,
        @Schema(description = "Cantidad de cuotas adeudadas", example = "3", minimum = "0")
        @NotNull @Min(0) Integer cuotasAdeudadas,
        @Schema(description = "Monto total adeudado", example = "1250.75", minimum = "0.00")
        @NotNull @DecimalMin("0.00") BigDecimal montoAdeudado
) {
}

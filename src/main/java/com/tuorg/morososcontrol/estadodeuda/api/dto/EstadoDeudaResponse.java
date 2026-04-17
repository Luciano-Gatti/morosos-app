package com.tuorg.morososcontrol.estadodeuda.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record EstadoDeudaResponse(
        UUID id,
        UUID inmuebleId,
        String numeroCuenta,
        Integer cuotasAdeudadas,
        BigDecimal montoAdeudado,
        LocalDateTime fechaActualizacion,
        boolean aptoParaSeguimiento
) {
}

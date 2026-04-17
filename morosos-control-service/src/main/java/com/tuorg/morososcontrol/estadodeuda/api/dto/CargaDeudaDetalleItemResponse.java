package com.tuorg.morososcontrol.estadodeuda.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CargaDeudaDetalleItemResponse(
        UUID inmuebleId,
        String numeroCuenta,
        Integer cuotasAdeudadas,
        BigDecimal montoAdeudado,
        boolean aptoParaSeguimiento
) {
}

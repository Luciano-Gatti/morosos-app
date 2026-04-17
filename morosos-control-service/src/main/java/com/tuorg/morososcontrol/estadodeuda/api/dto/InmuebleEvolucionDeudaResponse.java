package com.tuorg.morososcontrol.estadodeuda.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InmuebleEvolucionDeudaResponse(
        LocalDateTime fechaCarga,
        Integer cuotasAdeudadas,
        BigDecimal montoAdeudado,
        boolean aptoParaSeguimiento,
        boolean seguimientoHabilitadoEnEseMomento,
        String nombreArchivo
) {
}

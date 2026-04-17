package com.tuorg.morososcontrol.estadodeuda.application;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EstadoDeudaExcelRowData(
        int rowNumber,
        String numeroCuenta,
        Integer cuotasAdeudadas,
        BigDecimal montoAdeudado,
        LocalDateTime fechaActualizacion
) {
}

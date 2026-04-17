package com.tuorg.morososcontrol.estadodeuda.api.dto;

import java.util.List;

public record EstadoDeudaImportResponse(
        int totalProcesados,
        int actualizados,
        int errores,
        int cuentasNoEncontradas,
        List<String> detalleErrores,
        List<String> detalleCuentasNoEncontradas
) {
}

package com.tuorg.morososcontrol.inmueble.api.dto;

import java.util.List;

public record InmuebleImportResponse(
        int totalProcesados,
        int creados,
        int actualizados,
        int errores,
        List<String> detalleErrores
) {
}

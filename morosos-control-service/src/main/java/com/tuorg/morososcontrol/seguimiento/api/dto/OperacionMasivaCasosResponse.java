package com.tuorg.morososcontrol.seguimiento.api.dto;

import java.util.List;
import java.util.UUID;

public record OperacionMasivaCasosResponse(
        int totalSolicitados,
        int exitosos,
        int errores,
        List<UUID> procesados,
        List<String> detalleErrores
) {
}

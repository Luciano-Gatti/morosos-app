package com.tuorg.morososcontrol.estadodeuda.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CargaDeudaListadoResponse(
        UUID id,
        LocalDateTime fechaCarga,
        String nombreArchivo,
        String observacion,
        long cantidadRegistrosHistoricos
) {
}

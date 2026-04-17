package com.tuorg.morososcontrol.estadodeuda.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ReporteMorososPorCargaResponse(
        UUID idCarga,
        LocalDateTime fechaCarga,
        String nombreArchivo,
        int cantidadTotalMorosos,
        BigDecimal montoTotalAdeudado,
        List<MorososPorGrupoResponse> detallePorGrupo
) {
}

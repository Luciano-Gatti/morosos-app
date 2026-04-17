package com.tuorg.morososcontrol.estadodeuda.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Schema(description = "Resumen de morosidad agrupado por carga de importación")
public record ReporteMorososPorCargaResponse(
        @Schema(description = "Identificador de la carga", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
        UUID idCarga,
        @Schema(description = "Fecha y hora en la que se procesó la carga", example = "2026-04-17T14:45:00")
        LocalDateTime fechaCarga,
        @Schema(description = "Nombre del archivo importado", example = "deuda_marzo_2026.xlsx")
        String nombreArchivo,
        @Schema(description = "Total de morosos detectados en la carga", example = "84")
        int cantidadTotalMorosos,
        @Schema(description = "Monto total adeudado de la carga", example = "451230.50")
        BigDecimal montoTotalAdeudado,
        @Schema(description = "Desglose de morosos por grupo")
        List<MorososPorGrupoResponse> detallePorGrupo
) {
}

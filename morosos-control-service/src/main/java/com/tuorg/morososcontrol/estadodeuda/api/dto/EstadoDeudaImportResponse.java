package com.tuorg.morososcontrol.estadodeuda.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Resultado consolidado de la importación de deuda desde archivo Excel")
public record EstadoDeudaImportResponse(
        @Schema(description = "Total de filas procesadas", example = "120")
        int totalProcesados,
        @Schema(description = "Cantidad de estados de deuda actualizados", example = "98")
        int actualizados,
        @Schema(description = "Cantidad de filas con error de validación o parseo", example = "5")
        int errores,
        @Schema(description = "Cantidad de cuentas informadas que no existen en el sistema", example = "17")
        int cuentasNoEncontradas,
        @Schema(description = "Detalle de errores detectados durante el procesamiento")
        List<String> detalleErrores,
        @Schema(description = "Listado de cuentas no encontradas")
        List<String> detalleCuentasNoEncontradas
) {
}

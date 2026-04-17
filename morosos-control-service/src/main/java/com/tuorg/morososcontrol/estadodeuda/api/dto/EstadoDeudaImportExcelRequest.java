package com.tuorg.morososcontrol.estadodeuda.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Payload multipart para importar deuda desde Excel")
public record EstadoDeudaImportExcelRequest(
        @Schema(
                description = "Archivo Excel (.xls o .xlsx) con el detalle de deuda por cuenta",
                type = "string",
                format = "binary"
        )
        String file,
        @Schema(
                description = "Observación opcional para registrar contexto de la carga",
                example = "Carga de cierre mensual"
        )
        String observacion
) {
}

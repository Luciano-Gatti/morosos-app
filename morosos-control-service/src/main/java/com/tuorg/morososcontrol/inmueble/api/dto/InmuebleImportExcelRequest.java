package com.tuorg.morososcontrol.inmueble.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Payload multipart para importar inmuebles desde Excel")
public record InmuebleImportExcelRequest(
        @Schema(
                description = "Archivo Excel (.xls o .xlsx) con inmuebles",
                type = "string",
                format = "binary"
        )
        String file
) {
}

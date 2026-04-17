package com.tuorg.morososcontrol.seguimiento.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CerrarCasoSeguimientoRequest(
        @NotBlank @Size(max = 300) String motivoCierre
) {
}

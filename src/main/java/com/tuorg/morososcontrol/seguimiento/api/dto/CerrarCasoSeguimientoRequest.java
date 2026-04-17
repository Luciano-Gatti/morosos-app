package com.tuorg.morososcontrol.seguimiento.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CerrarCasoSeguimientoRequest(
        @NotBlank String motivoCierre
) {
}

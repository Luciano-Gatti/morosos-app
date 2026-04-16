package com.tuorg.morososcontrol.grupo.api.dto;

import jakarta.validation.constraints.NotBlank;

public record GrupoRequest(
        @NotBlank String nombre,
        boolean seguimientoActivo
) {
}

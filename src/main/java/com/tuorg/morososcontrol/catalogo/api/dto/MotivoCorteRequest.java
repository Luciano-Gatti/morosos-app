package com.tuorg.morososcontrol.catalogo.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MotivoCorteRequest(
        @NotBlank String nombre,
        @NotNull Boolean activo
) {
}

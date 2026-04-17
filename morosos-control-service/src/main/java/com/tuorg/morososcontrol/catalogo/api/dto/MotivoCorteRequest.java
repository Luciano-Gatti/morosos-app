package com.tuorg.morososcontrol.catalogo.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MotivoCorteRequest(
        @NotBlank @Size(max = 120) String nombre,
        @NotNull Boolean activo
) {
}

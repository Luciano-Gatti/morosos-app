package com.tuorg.morososcontrol.catalogo.api.dto;

import jakarta.validation.constraints.NotBlank;

public record TipoCorteRequest(
        @NotBlank String nombre
) {
}

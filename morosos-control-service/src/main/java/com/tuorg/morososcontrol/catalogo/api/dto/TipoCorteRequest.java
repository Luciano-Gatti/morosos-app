package com.tuorg.morososcontrol.catalogo.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TipoCorteRequest(
        @NotBlank @Size(max = 100) String nombre
) {
}

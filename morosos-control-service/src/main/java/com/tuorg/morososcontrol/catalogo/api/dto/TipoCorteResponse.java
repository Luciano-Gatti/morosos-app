package com.tuorg.morososcontrol.catalogo.api.dto;

import java.util.UUID;

public record TipoCorteResponse(
        UUID id,
        String nombre
) {
}

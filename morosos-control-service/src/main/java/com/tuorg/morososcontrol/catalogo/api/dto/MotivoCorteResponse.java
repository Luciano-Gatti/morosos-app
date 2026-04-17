package com.tuorg.morososcontrol.catalogo.api.dto;

import java.util.UUID;

public record MotivoCorteResponse(
        UUID id,
        String nombre,
        boolean activo
) {
}

package com.tuorg.morososcontrol.grupo.api.dto;

import java.util.UUID;

public record GrupoResponse(
        UUID id,
        String nombre,
        boolean seguimientoActivo
) {
}

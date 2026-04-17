package com.tuorg.morososcontrol.estadodeuda.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MorososPorGrupoResponse(
        UUID grupoId,
        String grupoNombre,
        int cantidadMorosos,
        BigDecimal montoTotalAdeudadoDelGrupo
) {
}

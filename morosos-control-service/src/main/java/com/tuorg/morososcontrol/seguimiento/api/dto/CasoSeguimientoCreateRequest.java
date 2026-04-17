package com.tuorg.morososcontrol.seguimiento.api.dto;

import com.tuorg.morososcontrol.seguimiento.domain.EtapaSeguimiento;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CasoSeguimientoCreateRequest(
        @NotNull UUID inmuebleId,
        @NotNull EtapaSeguimiento etapaInicial
) {
}

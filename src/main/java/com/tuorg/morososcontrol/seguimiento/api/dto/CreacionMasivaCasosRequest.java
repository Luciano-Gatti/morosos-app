package com.tuorg.morososcontrol.seguimiento.api.dto;

import com.tuorg.morososcontrol.seguimiento.domain.EtapaSeguimiento;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreacionMasivaCasosRequest(
        @NotEmpty List<@NotNull UUID> inmuebleIds,
        @NotNull EtapaSeguimiento etapaInicial
) {
}

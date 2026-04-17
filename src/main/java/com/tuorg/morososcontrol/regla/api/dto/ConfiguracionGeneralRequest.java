package com.tuorg.morososcontrol.regla.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ConfiguracionGeneralRequest(
        @NotNull @Min(1) Integer minimoCuotasSeguimiento
) {
}

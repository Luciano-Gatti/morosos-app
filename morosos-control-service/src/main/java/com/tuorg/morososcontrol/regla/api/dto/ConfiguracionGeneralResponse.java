package com.tuorg.morososcontrol.regla.api.dto;

import java.util.UUID;

public record ConfiguracionGeneralResponse(
        UUID id,
        Integer minimoCuotasSeguimiento
) {
}

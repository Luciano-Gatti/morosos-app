package com.tuorg.morososcontrol.seguimiento.api.dto;

import java.util.UUID;

public record InmuebleAptitudResponse(
        UUID inmuebleId,
        boolean aptoParaSeguimiento,
        String motivo
) {
}

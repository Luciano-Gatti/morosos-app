package com.tuorg.morososcontrol.seguimiento.api.dto;

import java.util.List;

public record SeleccionInmueblesResponse(
        int totalSolicitados,
        int aptos,
        int noAptos,
        List<InmuebleAptitudResponse> resultados
) {
}

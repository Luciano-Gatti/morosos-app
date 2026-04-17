package com.tuorg.morososcontrol.seguimiento.api.dto;

import java.time.LocalDate;
import java.util.UUID;

public record RegistroCorteResponse(
        UUID id,
        UUID casoSeguimientoId,
        LocalDate fecha,
        UUID tipoCorteId,
        String tipoCorte,
        UUID motivoCorteId,
        String motivoCorte,
        String observacion
) {
}

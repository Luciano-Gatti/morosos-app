package com.tuorg.morososcontrol.seguimiento.api.dto;

import com.tuorg.morososcontrol.seguimiento.domain.EstadoSeguimiento;
import com.tuorg.morososcontrol.seguimiento.domain.EtapaSeguimiento;

import java.time.LocalDateTime;
import java.util.UUID;

public record CasoSeguimientoResponse(
        UUID id,
        UUID inmuebleId,
        String numeroCuenta,
        EstadoSeguimiento estadoSeguimiento,
        EtapaSeguimiento etapaActual,
        LocalDateTime fechaInicio,
        LocalDateTime fechaCierre,
        String motivoCierre
) {
}

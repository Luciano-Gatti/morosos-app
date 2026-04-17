package com.tuorg.morososcontrol.seguimiento.api.dto;

import com.tuorg.morososcontrol.seguimiento.domain.EstadoCompromiso;

import java.time.LocalDate;
import java.util.UUID;

public record CompromisoPagoResponse(
        UUID id,
        UUID casoSeguimientoId,
        LocalDate fechaDesde,
        LocalDate fechaHasta,
        String observacion,
        EstadoCompromiso estadoCompromiso
) {
}

package com.tuorg.morososcontrol.seguimiento.api.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CompromisoPagoRequest(
        @NotNull LocalDate fechaDesde,
        LocalDate fechaHasta,
        String observacion
) {
}

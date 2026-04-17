package com.tuorg.morososcontrol.seguimiento.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CompromisoPagoRequest(
        @NotNull LocalDate fechaDesde,
        LocalDate fechaHasta,
        @Size(max = 500) String observacion
) {
}

package com.tuorg.morososcontrol.seguimiento.api.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record RegistroCorteRequest(
        @NotNull LocalDate fecha,
        @NotNull UUID tipoCorteId,
        @NotNull UUID motivoCorteId,
        String observacion
) {
}

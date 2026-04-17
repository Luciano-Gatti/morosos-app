package com.tuorg.morososcontrol.seguimiento.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record RegistroCorteRequest(
        @NotNull @PastOrPresent LocalDate fecha,
        @NotNull UUID tipoCorteId,
        @NotNull UUID motivoCorteId,
        @Size(max = 500) String observacion
) {
}

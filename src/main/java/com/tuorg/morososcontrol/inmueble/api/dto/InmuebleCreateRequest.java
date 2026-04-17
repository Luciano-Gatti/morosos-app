package com.tuorg.morososcontrol.inmueble.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InmuebleCreateRequest(
        @NotBlank String numeroCuenta,
        @NotBlank String propietarioNombre,
        @NotBlank String distrito,
        @NotBlank String direccionCompleta,
        @NotNull UUID grupoId,
        @NotNull Boolean activo
) {
}

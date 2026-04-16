package com.tuorg.morososcontrol.inmueble.api.dto;

import jakarta.validation.constraints.NotBlank;

public record InmuebleCreateRequest(
        @NotBlank String numeroCuenta,
        @NotBlank String propietarioNombre,
        @NotBlank String distrito,
        @NotBlank String direccionCompleta,
        boolean activo
) {
}

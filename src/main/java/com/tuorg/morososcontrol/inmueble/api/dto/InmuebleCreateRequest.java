package com.tuorg.morososcontrol.inmueble.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record InmuebleCreateRequest(
        @NotBlank @Size(max = 40) String numeroCuenta,
        @NotBlank @Size(max = 120) String propietarioNombre,
        @NotBlank @Size(max = 80) String distrito,
        @NotBlank @Size(max = 220) String direccionCompleta,
        @NotNull UUID grupoId,
        @NotNull Boolean activo
) {
}

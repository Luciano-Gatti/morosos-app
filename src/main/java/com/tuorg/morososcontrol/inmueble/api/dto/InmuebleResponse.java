package com.tuorg.morososcontrol.inmueble.api.dto;

import java.util.UUID;

public record InmuebleResponse(
        UUID id,
        String numeroCuenta,
        String propietarioNombre,
        String distrito,
        String direccionCompleta,
        boolean activo
) {
}

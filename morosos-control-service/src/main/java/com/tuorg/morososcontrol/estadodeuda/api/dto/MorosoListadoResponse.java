package com.tuorg.morososcontrol.estadodeuda.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record MorosoListadoResponse(
        UUID inmuebleId,
        String numeroCuenta,
        String propietarioNombre,
        String direccionCompleta,
        String distrito,
        UUID grupoId,
        String grupo,
        Integer cuotasAdeudadas,
        BigDecimal montoAdeudado,
        boolean seguimientoHabilitado,
        boolean aptoParaSeguimiento,
        LocalDateTime fechaActualizacion
) {
}

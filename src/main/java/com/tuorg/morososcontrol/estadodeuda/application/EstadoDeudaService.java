package com.tuorg.morososcontrol.estadodeuda.application;

import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaRequest;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.MorosoListadoResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface EstadoDeudaService {

    EstadoDeudaResponse create(EstadoDeudaRequest request);

    EstadoDeudaResponse update(UUID id, EstadoDeudaRequest request);

    EstadoDeudaResponse findById(UUID id);

    EstadoDeudaResponse findByInmueble(UUID inmuebleId);

    boolean calcularAptoParaSeguimiento(UUID inmuebleId);

    List<MorosoListadoResponse> listarMorosos(
            String numeroCuenta,
            String propietarioNombre,
            String direccionCompleta,
            String distrito,
            String grupo,
            Integer cuotasAdeudadas,
            BigDecimal montoAdeudado,
            Boolean seguimientoHabilitado,
            Boolean aptoParaSeguimiento
    );
}

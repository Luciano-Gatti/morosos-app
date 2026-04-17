package com.tuorg.morososcontrol.seguimiento.application;

import com.tuorg.morososcontrol.seguimiento.api.dto.CasoSeguimientoCreateRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.CasoSeguimientoResponse;
import com.tuorg.morososcontrol.seguimiento.api.dto.CerrarCasoSeguimientoRequest;
import com.tuorg.morososcontrol.seguimiento.domain.EstadoSeguimiento;

import java.util.List;
import java.util.UUID;

public interface CasoSeguimientoService {

    CasoSeguimientoResponse crearCaso(CasoSeguimientoCreateRequest request);

    CasoSeguimientoResponse findById(UUID id);

    List<CasoSeguimientoResponse> findAll(UUID inmuebleId, EstadoSeguimiento estadoSeguimiento);

    CasoSeguimientoResponse avanzarEtapa(UUID casoId);

    CasoSeguimientoResponse repetirEtapa(UUID casoId);

    CasoSeguimientoResponse cerrarCaso(UUID casoId, CerrarCasoSeguimientoRequest request);
}

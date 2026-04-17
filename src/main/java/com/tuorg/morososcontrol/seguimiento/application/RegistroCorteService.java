package com.tuorg.morososcontrol.seguimiento.application;

import com.tuorg.morososcontrol.seguimiento.api.dto.RegistroCorteRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.RegistroCorteResponse;

import java.util.List;
import java.util.UUID;

public interface RegistroCorteService {

    RegistroCorteResponse registrar(UUID casoSeguimientoId, RegistroCorteRequest request);

    List<RegistroCorteResponse> listarPorCaso(UUID casoSeguimientoId);
}

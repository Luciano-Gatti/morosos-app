package com.tuorg.morososcontrol.seguimiento.application;

import com.tuorg.morososcontrol.seguimiento.api.dto.CreacionMasivaCasosRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.OperacionMasivaCasosRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.OperacionMasivaCasosResponse;
import com.tuorg.morososcontrol.seguimiento.api.dto.SeleccionInmueblesRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.SeleccionInmueblesResponse;

public interface CasoSeguimientoMasivoService {

    SeleccionInmueblesResponse validarInmueblesAptos(SeleccionInmueblesRequest request);

    OperacionMasivaCasosResponse crearCasos(CreacionMasivaCasosRequest request);

    OperacionMasivaCasosResponse avanzarEtapa(OperacionMasivaCasosRequest request);

    OperacionMasivaCasosResponse repetirEtapa(OperacionMasivaCasosRequest request);
}

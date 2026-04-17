package com.tuorg.morososcontrol.seguimiento.application;

import com.tuorg.morososcontrol.seguimiento.api.dto.CompromisoPagoRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.CompromisoPagoResponse;

import java.util.List;
import java.util.UUID;

public interface CompromisoPagoService {

    CompromisoPagoResponse registrarCompromiso(UUID casoSeguimientoId, CompromisoPagoRequest request);

    CompromisoPagoResponse marcarIncumplido(UUID compromisoPagoId);

    List<CompromisoPagoResponse> listarPorCaso(UUID casoSeguimientoId);

    void actualizarCompromisosVencidos(UUID casoSeguimientoId);
}

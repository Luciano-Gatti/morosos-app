package com.tuorg.morososcontrol.catalogo.application;

import com.tuorg.morososcontrol.catalogo.api.dto.TipoCorteRequest;
import com.tuorg.morososcontrol.catalogo.api.dto.TipoCorteResponse;

import java.util.List;
import java.util.UUID;

public interface TipoCorteService {

    TipoCorteResponse create(TipoCorteRequest request);

    TipoCorteResponse findById(UUID id);

    List<TipoCorteResponse> findAll();

    TipoCorteResponse update(UUID id, TipoCorteRequest request);

    void delete(UUID id);
}

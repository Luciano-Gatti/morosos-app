package com.tuorg.morososcontrol.catalogo.application;

import com.tuorg.morososcontrol.catalogo.api.dto.MotivoCorteRequest;
import com.tuorg.morososcontrol.catalogo.api.dto.MotivoCorteResponse;

import java.util.List;
import java.util.UUID;

public interface MotivoCorteService {

    MotivoCorteResponse create(MotivoCorteRequest request);

    MotivoCorteResponse findById(UUID id);

    List<MotivoCorteResponse> findAll();

    List<MotivoCorteResponse> findOperativos();

    MotivoCorteResponse update(UUID id, MotivoCorteRequest request);

    void delete(UUID id);
}

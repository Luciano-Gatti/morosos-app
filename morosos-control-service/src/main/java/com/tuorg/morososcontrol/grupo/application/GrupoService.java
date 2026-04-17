package com.tuorg.morososcontrol.grupo.application;

import com.tuorg.morososcontrol.grupo.api.dto.GrupoRequest;
import com.tuorg.morososcontrol.grupo.api.dto.GrupoResponse;

import java.util.List;
import java.util.UUID;

public interface GrupoService {

    GrupoResponse create(GrupoRequest request);

    GrupoResponse findById(UUID id);

    List<GrupoResponse> findAll();

    GrupoResponse update(UUID id, GrupoRequest request);

    void delete(UUID id);

    void recalcularInmueblesAsociados(UUID grupoId);
}

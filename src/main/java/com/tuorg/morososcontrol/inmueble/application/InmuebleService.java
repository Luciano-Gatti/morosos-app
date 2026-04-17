package com.tuorg.morososcontrol.inmueble.application;

import com.tuorg.morososcontrol.inmueble.api.dto.InmuebleCreateRequest;
import com.tuorg.morososcontrol.inmueble.api.dto.InmuebleResponse;

import java.util.List;
import java.util.UUID;

public interface InmuebleService {

    InmuebleResponse create(InmuebleCreateRequest request);

    InmuebleResponse findById(UUID id);

    List<InmuebleResponse> findAll(
            String numeroCuenta,
            String propietarioNombre,
            String direccionCompleta,
            String distrito
    );

    InmuebleResponse update(UUID id, InmuebleCreateRequest request);

    void delete(UUID id);
}

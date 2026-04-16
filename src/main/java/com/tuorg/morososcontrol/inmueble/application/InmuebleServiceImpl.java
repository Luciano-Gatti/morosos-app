package com.tuorg.morososcontrol.inmueble.application;

import com.tuorg.morososcontrol.inmueble.api.dto.InmuebleCreateRequest;
import com.tuorg.morososcontrol.inmueble.api.dto.InmuebleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class InmuebleServiceImpl implements InmuebleService {

    @Override
    public InmuebleResponse create(InmuebleCreateRequest request) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "Pendiente de implementación V1");
    }

    @Override
    public InmuebleResponse findById(UUID id) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "Pendiente de implementación V1");
    }

    @Override
    public List<InmuebleResponse> findAll() {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "Pendiente de implementación V1");
    }
}

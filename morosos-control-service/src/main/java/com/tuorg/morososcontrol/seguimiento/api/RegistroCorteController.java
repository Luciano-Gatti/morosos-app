package com.tuorg.morososcontrol.seguimiento.api;

import com.tuorg.morososcontrol.seguimiento.api.dto.RegistroCorteRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.RegistroCorteResponse;
import com.tuorg.morososcontrol.seguimiento.application.RegistroCorteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/casos-seguimiento/{casoId}/registros-corte")
public class RegistroCorteController {

    private final RegistroCorteService registroCorteService;

    public RegistroCorteController(RegistroCorteService registroCorteService) {
        this.registroCorteService = registroCorteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RegistroCorteResponse registrar(
            @PathVariable UUID casoId,
            @Valid @RequestBody RegistroCorteRequest request
    ) {
        return registroCorteService.registrar(casoId, request);
    }

    @GetMapping
    public List<RegistroCorteResponse> listarPorCaso(@PathVariable UUID casoId) {
        return registroCorteService.listarPorCaso(casoId);
    }
}

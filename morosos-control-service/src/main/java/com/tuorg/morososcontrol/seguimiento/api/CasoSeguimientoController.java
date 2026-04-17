package com.tuorg.morososcontrol.seguimiento.api;

import com.tuorg.morososcontrol.seguimiento.api.dto.CasoSeguimientoCreateRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.CasoSeguimientoResponse;
import com.tuorg.morososcontrol.seguimiento.api.dto.CerrarCasoSeguimientoRequest;
import com.tuorg.morososcontrol.seguimiento.application.CasoSeguimientoService;
import com.tuorg.morososcontrol.seguimiento.domain.EstadoSeguimiento;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/casos-seguimiento")
public class CasoSeguimientoController {

    private final CasoSeguimientoService casoSeguimientoService;

    public CasoSeguimientoController(CasoSeguimientoService casoSeguimientoService) {
        this.casoSeguimientoService = casoSeguimientoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CasoSeguimientoResponse crearCaso(@Valid @RequestBody CasoSeguimientoCreateRequest request) {
        return casoSeguimientoService.crearCaso(request);
    }

    @GetMapping("/{id}")
    public CasoSeguimientoResponse findById(@PathVariable UUID id) {
        return casoSeguimientoService.findById(id);
    }

    @GetMapping
    public List<CasoSeguimientoResponse> findAll(
            @RequestParam(required = false) UUID inmuebleId,
            @RequestParam(required = false) EstadoSeguimiento estadoSeguimiento
    ) {
        return casoSeguimientoService.findAll(inmuebleId, estadoSeguimiento);
    }

    @PostMapping("/{id}/avanzar-etapa")
    public CasoSeguimientoResponse avanzarEtapa(@PathVariable UUID id) {
        return casoSeguimientoService.avanzarEtapa(id);
    }

    @PostMapping("/{id}/repetir-etapa")
    public CasoSeguimientoResponse repetirEtapa(@PathVariable UUID id) {
        return casoSeguimientoService.repetirEtapa(id);
    }

    @PostMapping("/{id}/cerrar")
    public CasoSeguimientoResponse cerrarCaso(
            @PathVariable UUID id,
            @Valid @RequestBody CerrarCasoSeguimientoRequest request
    ) {
        return casoSeguimientoService.cerrarCaso(id, request);
    }
}

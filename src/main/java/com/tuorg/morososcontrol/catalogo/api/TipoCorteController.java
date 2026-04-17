package com.tuorg.morososcontrol.catalogo.api;

import com.tuorg.morososcontrol.catalogo.api.dto.TipoCorteRequest;
import com.tuorg.morososcontrol.catalogo.api.dto.TipoCorteResponse;
import com.tuorg.morososcontrol.catalogo.application.TipoCorteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tipos-corte")
public class TipoCorteController {

    private final TipoCorteService tipoCorteService;

    public TipoCorteController(TipoCorteService tipoCorteService) {
        this.tipoCorteService = tipoCorteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TipoCorteResponse create(@Valid @RequestBody TipoCorteRequest request) {
        return tipoCorteService.create(request);
    }

    @GetMapping("/{id}")
    public TipoCorteResponse findById(@PathVariable UUID id) {
        return tipoCorteService.findById(id);
    }

    @GetMapping
    public List<TipoCorteResponse> findAll() {
        return tipoCorteService.findAll();
    }

    @PutMapping("/{id}")
    public TipoCorteResponse update(@PathVariable UUID id, @Valid @RequestBody TipoCorteRequest request) {
        return tipoCorteService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        tipoCorteService.delete(id);
    }
}

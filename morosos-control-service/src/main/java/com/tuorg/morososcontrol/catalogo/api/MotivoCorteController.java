package com.tuorg.morososcontrol.catalogo.api;

import com.tuorg.morososcontrol.catalogo.api.dto.MotivoCorteRequest;
import com.tuorg.morososcontrol.catalogo.api.dto.MotivoCorteResponse;
import com.tuorg.morososcontrol.catalogo.application.MotivoCorteService;
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
@RequestMapping("/api/v1/motivos-corte")
public class MotivoCorteController {

    private final MotivoCorteService motivoCorteService;

    public MotivoCorteController(MotivoCorteService motivoCorteService) {
        this.motivoCorteService = motivoCorteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MotivoCorteResponse create(@Valid @RequestBody MotivoCorteRequest request) {
        return motivoCorteService.create(request);
    }

    @GetMapping("/{id}")
    public MotivoCorteResponse findById(@PathVariable UUID id) {
        return motivoCorteService.findById(id);
    }

    @GetMapping
    public List<MotivoCorteResponse> findAll() {
        return motivoCorteService.findAll();
    }

    @GetMapping("/operativos")
    public List<MotivoCorteResponse> findOperativos() {
        return motivoCorteService.findOperativos();
    }

    @PutMapping("/{id}")
    public MotivoCorteResponse update(@PathVariable UUID id, @Valid @RequestBody MotivoCorteRequest request) {
        return motivoCorteService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        motivoCorteService.delete(id);
    }
}

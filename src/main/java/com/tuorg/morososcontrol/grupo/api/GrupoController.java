package com.tuorg.morososcontrol.grupo.api;

import com.tuorg.morososcontrol.grupo.api.dto.GrupoRequest;
import com.tuorg.morososcontrol.grupo.api.dto.GrupoResponse;
import com.tuorg.morososcontrol.grupo.application.GrupoService;
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
@RequestMapping("/api/v1/grupos")
public class GrupoController {

    private final GrupoService grupoService;

    public GrupoController(GrupoService grupoService) {
        this.grupoService = grupoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GrupoResponse create(@Valid @RequestBody GrupoRequest request) {
        return grupoService.create(request);
    }

    @GetMapping("/{id}")
    public GrupoResponse findById(@PathVariable UUID id) {
        return grupoService.findById(id);
    }

    @GetMapping
    public List<GrupoResponse> findAll() {
        return grupoService.findAll();
    }

    @PutMapping("/{id}")
    public GrupoResponse update(@PathVariable UUID id, @Valid @RequestBody GrupoRequest request) {
        return grupoService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        grupoService.delete(id);
    }
}

package pe.morosos.distrito.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.common.dto.ToggleActivoRequest;
import pe.morosos.distrito.dto.DistritoRequest;
import pe.morosos.distrito.dto.DistritoResponse;
import pe.morosos.distrito.service.DistritoService;

@RestController
@RequestMapping("/api/v1/distritos")
@RequiredArgsConstructor
public class DistritoController {

    private final DistritoService distritoService;

    @GetMapping
    public List<DistritoResponse> findAll() {
        return distritoService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DistritoResponse create(@Valid @RequestBody DistritoRequest request) {
        return distritoService.create(request);
    }

    @PutMapping("/{id}")
    public DistritoResponse update(@PathVariable UUID id, @Valid @RequestBody DistritoRequest request) {
        return distritoService.update(id, request);
    }

    @PatchMapping("/{id}/activo")
    public DistritoResponse updateActivo(@PathVariable UUID id, @Valid @RequestBody ToggleActivoRequest request) {
        return distritoService.updateActivo(id, request.activo());
    }
}

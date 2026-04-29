package pe.morosos.grupo.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
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
import pe.morosos.grupo.dto.GrupoRequest;
import pe.morosos.grupo.dto.GrupoResponse;
import pe.morosos.grupo.service.GrupoService;

@RestController
@RequestMapping("/api/v1/grupos")
@RequiredArgsConstructor
public class GrupoController {

    private final GrupoService grupoService;

    @GetMapping
    public List<GrupoResponse> findAll() {
        return grupoService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GrupoResponse create(@Valid @RequestBody GrupoRequest request) {
        return grupoService.create(request);
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

    @PatchMapping("/{id}/activo")
    public GrupoResponse updateActivo(@PathVariable UUID id, @Valid @RequestBody ToggleActivoRequest request) {
        return grupoService.updateActivo(id, request.activo());
    }
}

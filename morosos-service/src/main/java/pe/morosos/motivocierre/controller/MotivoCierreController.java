package pe.morosos.motivocierre.controller;

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
import pe.morosos.motivocierre.dto.MotivoCierreRequest;
import pe.morosos.motivocierre.dto.MotivoCierreResponse;
import pe.morosos.motivocierre.service.MotivoCierreService;

@RestController
@RequestMapping("/api/v1/motivos-cierre")
@RequiredArgsConstructor
public class MotivoCierreController {

    private final MotivoCierreService service;

    @GetMapping
    public List<MotivoCierreResponse> findAll() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MotivoCierreResponse create(@Valid @RequestBody MotivoCierreRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public MotivoCierreResponse update(@PathVariable UUID id, @Valid @RequestBody MotivoCierreRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/activo")
    public MotivoCierreResponse updateActivo(@PathVariable UUID id, @Valid @RequestBody ToggleActivoRequest request) {
        return service.updateActivo(id, request.activo());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}

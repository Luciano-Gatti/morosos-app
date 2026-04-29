package pe.morosos.inmueble.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.common.dto.ToggleActivoRequest;
import pe.morosos.inmueble.dto.InmuebleFilterRequest;
import pe.morosos.inmueble.dto.InmuebleResponse;
import pe.morosos.inmueble.dto.InmuebleUpdateRequest;
import pe.morosos.inmueble.dto.SeguimientoHabilitadoPatchRequest;
import pe.morosos.inmueble.service.InmuebleService;

@RestController
@RequestMapping("/api/v1/inmuebles")
@RequiredArgsConstructor
public class InmuebleController {

    private final InmuebleService inmuebleService;

    @GetMapping
    public Page<InmuebleResponse> findAll(@RequestParam(required = false) String cuenta,
                                          @RequestParam(required = false) String titular,
                                          @RequestParam(required = false) UUID grupoId,
                                          @RequestParam(required = false) UUID distritoId,
                                          @RequestParam(required = false) Boolean activo,
                                          @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        InmuebleFilterRequest filter = new InmuebleFilterRequest(cuenta, titular, grupoId, distritoId, activo);
        return inmuebleService.findAll(filter, pageable);
    }

    @GetMapping("/{id}")
    public InmuebleResponse findById(@PathVariable UUID id) {
        return inmuebleService.findById(id);
    }

    @PutMapping("/{id}")
    public InmuebleResponse update(@PathVariable UUID id, @Valid @RequestBody InmuebleUpdateRequest request) {
        return inmuebleService.update(id, request);
    }

    @PatchMapping("/{id}/activo")
    public InmuebleResponse updateActivo(@PathVariable UUID id, @Valid @RequestBody ToggleActivoRequest request) {
        return inmuebleService.updateActivo(id, request.activo());
    }

    @PatchMapping("/{id}/seguimiento-habilitado")
    public InmuebleResponse updateSeguimientoHabilitado(@PathVariable UUID id,
                                                        @Valid @RequestBody SeguimientoHabilitadoPatchRequest request) {
        return inmuebleService.updateSeguimientoHabilitado(id, request.seguimientoHabilitado());
    }
}

package pe.morosos.grupodistrito.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import pe.morosos.grupodistrito.dto.GrupoDistritoConfigRequest;
import pe.morosos.grupodistrito.dto.GrupoDistritoConfigResponse;
import pe.morosos.grupodistrito.service.GrupoDistritoConfigService;

@RestController
@RequestMapping("/api/v1/grupo-distrito-config")
@RequiredArgsConstructor
public class GrupoDistritoConfigController {

    private final GrupoDistritoConfigService service;

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_VER_GRUPO_DISTRITO)")
    @GetMapping
    public List<GrupoDistritoConfigResponse> findAll() {
        return service.findAll();
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_EDITAR_GRUPO_DISTRITO)")
    @PutMapping("/{id}")
    public GrupoDistritoConfigResponse update(@PathVariable UUID id,
                                              @Valid @RequestBody GrupoDistritoConfigRequest request) {
        return service.update(id, request);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_CREAR_GRUPO_DISTRITO)")
    @PostMapping
    public GrupoDistritoConfigResponse create(@Valid @RequestBody GrupoDistritoConfigRequest request) {
        return service.create(request);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_ELIMINAR_GRUPO_DISTRITO)")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}

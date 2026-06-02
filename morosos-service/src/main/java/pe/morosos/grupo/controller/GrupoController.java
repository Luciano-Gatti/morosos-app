package pe.morosos.grupo.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_VER_GRUPOS)")
    @GetMapping
    public List<GrupoResponse> findAll() {
        return grupoService.findAll();
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_CREAR_GRUPO)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GrupoResponse create(@Valid @RequestBody GrupoRequest request) {
        return grupoService.create(request);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_EDITAR_GRUPO)")
    @PutMapping("/{id}")
    public GrupoResponse update(@PathVariable UUID id, @Valid @RequestBody GrupoRequest request) {
        return grupoService.update(id, request);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_ELIMINAR_GRUPO)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        grupoService.delete(id);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_ACTIVAR_DESACTIVAR_GRUPO)")
    @PatchMapping("/{id}/activo")
    public GrupoResponse updateActivo(@PathVariable UUID id, @Valid @RequestBody ToggleActivoRequest request) {
        return grupoService.updateActivo(id, request.activo());
    }
}

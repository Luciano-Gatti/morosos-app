package pe.morosos.etapa.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
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
import pe.morosos.etapa.dto.EtapaConfigRequest;
import pe.morosos.etapa.dto.EtapaConfigResponse;
import pe.morosos.etapa.dto.EtapaReordenarRequest;
import pe.morosos.etapa.service.EtapaConfigService;

@RestController
@RequestMapping("/api/v1/etapas")
@RequiredArgsConstructor
public class EtapaConfigController {

    private final EtapaConfigService service;

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_VER_ETAPAS)")
    @GetMapping
    public List<EtapaConfigResponse> findAll() {
        return service.findAll();
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_CREAR_ETAPA)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EtapaConfigResponse create(@Valid @RequestBody EtapaConfigRequest request) {
        return service.create(request);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_EDITAR_ETAPA)")
    @PutMapping("/{id}")
    public EtapaConfigResponse update(@PathVariable UUID id, @Valid @RequestBody EtapaConfigRequest request) {
        return service.update(id, request);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_REORDENAR_ETAPAS)")
    @PostMapping("/reordenar")
    public List<EtapaConfigResponse> reorder(@Valid @RequestBody EtapaReordenarRequest request) {
        return service.reorder(request);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_ELIMINAR_ETAPA)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}

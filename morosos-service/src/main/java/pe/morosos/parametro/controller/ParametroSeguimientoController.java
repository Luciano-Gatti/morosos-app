package pe.morosos.parametro.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.parametro.dto.ImpactoSeguimientoRequest;
import pe.morosos.parametro.dto.ImpactoSeguimientoResponse;
import pe.morosos.parametro.dto.ParametroSeguimientoRequest;
import pe.morosos.parametro.dto.ParametroSeguimientoResponse;
import pe.morosos.parametro.service.ParametroSeguimientoService;

@RestController
@RequestMapping("/api/v1/parametros-seguimiento")
@RequiredArgsConstructor
public class ParametroSeguimientoController {

    private final ParametroSeguimientoService service;

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_VER_PARAMETROS_SEGUIMIENTO)")
    @GetMapping
    public List<ParametroSeguimientoResponse> findAll() {
        return service.findAll();
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_EDITAR_PARAMETROS_SEGUIMIENTO)")
    @PutMapping("/{codigo}")
    public ParametroSeguimientoResponse updateByCodigo(@PathVariable String codigo,
                                                       @Valid @RequestBody ParametroSeguimientoRequest request) {
        return service.updateByCodigo(codigo, request);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).CONFIG_CALCULAR_IMPACTO_PARAMETROS)")
    @PostMapping("/impacto")
    public ImpactoSeguimientoResponse calcularImpacto(@Valid @RequestBody ImpactoSeguimientoRequest request) {
        return service.calcularImpacto(request);
    }
}

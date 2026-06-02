package pe.morosos.inmueble.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.common.dto.ToggleActivoRequest;
import pe.morosos.inmueble.dto.HistorialDeudaInmuebleResponse;
import pe.morosos.inmueble.dto.InmuebleFilterRequest;
import pe.morosos.inmueble.dto.ObservacionesExpedienteResponse;
import pe.morosos.inmueble.dto.InmuebleResponse;
import pe.morosos.inmueble.dto.InmuebleUpdateRequest;
import pe.morosos.inmueble.dto.SeguimientoHabilitadoPatchRequest;
import pe.morosos.inmueble.service.InmuebleService;

@RestController
@RequestMapping("/api/v1/inmuebles")
@RequiredArgsConstructor
public class InmuebleController {

    private final InmuebleService inmuebleService;

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).INMUEBLES_VER_LISTADO)")
    @GetMapping
    public Page<InmuebleResponse> findAll(@RequestParam(required = false) String q,
                                          @RequestParam(required = false) String campo,
                                          @RequestParam(required = false) UUID grupoId,
                                          @RequestParam(required = false) UUID distritoId,
                                          @RequestParam(required = false) Boolean activo,
                                          @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        InmuebleFilterRequest filter = new InmuebleFilterRequest(q, campo, grupoId, distritoId, activo);
        return inmuebleService.findAll(filter, pageable);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).INMUEBLES_VER_DETALLE)")
    @GetMapping("/{id}")
    public InmuebleResponse findById(@PathVariable UUID id) {
        return inmuebleService.findById(id);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).INMUEBLES_EDITAR)")
    @PutMapping("/{id}")
    public InmuebleResponse update(@PathVariable UUID id, @Valid @RequestBody InmuebleUpdateRequest request) {
        return inmuebleService.update(id, request);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).INMUEBLES_ACTIVAR_DESACTIVAR)")
    @PatchMapping("/{id}/activo")
    public InmuebleResponse updateActivo(@PathVariable UUID id, @Valid @RequestBody ToggleActivoRequest request) {
        return inmuebleService.updateActivo(id, request.activo());
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).INMUEBLES_VER_HISTORIAL_DEUDA)")
    @GetMapping("/{id}/historial-deuda")
    public HistorialDeudaInmuebleResponse historialDeuda(@PathVariable UUID id,
                                                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
                                                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {
        return inmuebleService.obtenerHistorialDeuda(id, fechaDesde, fechaHasta);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).INMUEBLES_VER_OBSERVACIONES_EXPEDIENTE)")
    @GetMapping("/{id}/observaciones-expediente")
    public ObservacionesExpedienteResponse observacionesExpediente(@PathVariable UUID id,
                                                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
                                                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
                                                                    @RequestParam(required = false) UUID etapaId,
                                                                    @RequestParam(required = false) String estadoProceso,
                                                                    @RequestParam(required = false) String q) {
        return inmuebleService.obtenerObservacionesExpediente(id, fechaDesde, fechaHasta, etapaId, estadoProceso, q);
    }

    @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).INMUEBLES_EDITAR_SEGUIMIENTO)")
    @PatchMapping("/{id}/seguimiento-habilitado")
    public InmuebleResponse updateSeguimientoHabilitado(@PathVariable UUID id,
                                                        @Valid @RequestBody SeguimientoHabilitadoPatchRequest request) {
        return inmuebleService.updateSeguimientoHabilitado(id, request.seguimientoHabilitado());
    }
}

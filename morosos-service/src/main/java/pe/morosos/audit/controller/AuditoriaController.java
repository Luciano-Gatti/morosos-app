package pe.morosos.audit.controller;

import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.audit.dto.AuditLogResponse;
import pe.morosos.audit.service.AuditoriaConsultaService;
import pe.morosos.common.api.PageResponse;

@RestController
@RequestMapping("/api/v1/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {
    private final AuditoriaConsultaService auditoriaConsultaService;

    @GetMapping("/movimientos")
    public PageResponse<AuditLogResponse> getMovimientos(@RequestParam(required = false) String entityType,
                                                         @RequestParam(required = false) UUID entityId,
                                                         @RequestParam(required = false) String action,
                                                         @RequestParam(required = false) UUID actorId,
                                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
                                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
                                                         @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.from(auditoriaConsultaService.buscarMovimientos(
                entityType, entityId, action, actorId, fechaDesde, fechaHasta, pageable
        ));
    }
}

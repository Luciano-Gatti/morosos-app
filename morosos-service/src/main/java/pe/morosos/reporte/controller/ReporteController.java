package pe.morosos.reporte.controller;

import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.reporte.service.ReporteService;

@RestController
@RequestMapping("/api/v1/reportes")
@RequiredArgsConstructor
public class ReporteController {
    private final ReporteService reporteService;

    @GetMapping("/{reporteId}")
    public Object getReporte(@PathVariable String reporteId,
                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
                             @RequestParam(required = false) String action,
                             @RequestParam(required = false) String entityType,
                             @RequestParam(required = false) String tipoAccion,
                             @RequestParam(required = false) java.util.UUID grupoId,
                             @RequestParam(required = false) java.util.UUID distritoId,
                             @RequestParam(required = false) java.util.UUID actorId,
                             @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return reporteService.obtenerReporte(reporteId, fechaDesde, fechaHasta, action, entityType, tipoAccion, grupoId, distritoId, actorId, pageable);
    }
}

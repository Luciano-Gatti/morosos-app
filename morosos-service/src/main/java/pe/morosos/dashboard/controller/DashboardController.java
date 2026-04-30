package pe.morosos.dashboard.controller;

import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.dashboard.dto.DashboardResumenResponse;
import pe.morosos.dashboard.service.DashboardService;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/resumen")
    public ResponseEntity<DashboardResumenResponse> resumen(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) UUID grupoId,
            @RequestParam(required = false) UUID distritoId) {
        return ResponseEntity.ok(dashboardService.resumen(fechaDesde, fechaHasta, grupoId, distritoId));
    }
}

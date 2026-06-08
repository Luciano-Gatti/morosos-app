package pe.morosos.auth.admin.api;

import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.auth.admin.dto.AuthAuditResponse;
import pe.morosos.auth.admin.service.AuthAuditQueryService;

@RestController
@RequestMapping("/api/v1/admin/auth-audit")
public class AdminAuthAuditController {

    private final AuthAuditQueryService authAuditQueryService;

    public AdminAuthAuditController(AuthAuditQueryService authAuditQueryService) {
        this.authAuditQueryService = authAuditQueryService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('AUDITORIA_VER_MOVIMIENTOS')")
    public Page<AuthAuditResponse> search(
            @RequestParam(required = false) String usuario,
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return authAuditQueryService.search(usuario, accion, fechaDesde, fechaHasta, page, size);
    }
}

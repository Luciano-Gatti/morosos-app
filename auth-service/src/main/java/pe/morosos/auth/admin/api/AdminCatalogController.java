package pe.morosos.auth.admin.api;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.auth.admin.dto.PermissionResponse;
import pe.morosos.auth.admin.dto.RoleResponse;
import pe.morosos.auth.admin.service.AdminCatalogService;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminCatalogController {
    private final AdminCatalogService adminCatalogService;

    public AdminCatalogController(AdminCatalogService adminCatalogService) { this.adminCatalogService = adminCatalogService; }

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('ROLES_VER_LISTADO')")
    public List<RoleResponse> roles() { return adminCatalogService.roles(); }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('PERMISOS_VER_LISTADO')")
    public List<PermissionResponse> permissions() { return adminCatalogService.permissions(); }
}

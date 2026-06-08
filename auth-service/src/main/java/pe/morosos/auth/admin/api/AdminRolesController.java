package pe.morosos.auth.admin.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.auth.admin.dto.RoleRequest;
import pe.morosos.auth.admin.dto.RoleResponse;
import pe.morosos.auth.admin.dto.RoleStatusRequest;
import pe.morosos.auth.admin.service.AdminRoleService;

@RestController
@RequestMapping("/api/v1/admin/roles")
public class AdminRolesController {
    private final AdminRoleService adminRoleService;

    public AdminRolesController(AdminRoleService adminRoleService) {
        this.adminRoleService = adminRoleService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLES_VER_LISTADO')")
    public List<RoleResponse> list(@RequestParam(name = "includeInactive", defaultValue = "false") boolean includeInactive) {
        return adminRoleService.list(includeInactive);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLES_CREAR') and hasAuthority('ROLES_ASIGNAR_PERMISOS')")
    public RoleResponse create(@Valid @RequestBody RoleRequest request, HttpServletRequest httpRequest) {
        return adminRoleService.create(request, httpRequest);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLES_EDITAR') and hasAuthority('ROLES_ASIGNAR_PERMISOS')")
    public RoleResponse update(@PathVariable("id") UUID id, @Valid @RequestBody RoleRequest request, HttpServletRequest httpRequest) {
        return adminRoleService.update(id, request, httpRequest);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLES_ACTIVAR_DESACTIVAR')")
    public RoleResponse status(@PathVariable("id") UUID id, @Valid @RequestBody RoleStatusRequest request, HttpServletRequest httpRequest) {
        return adminRoleService.changeStatus(id, request, httpRequest);
    }
}

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
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.auth.admin.dto.AdminUserRequest;
import pe.morosos.auth.admin.dto.AdminUserResponse;
import pe.morosos.auth.admin.dto.ApproveUserRequest;
import pe.morosos.auth.admin.dto.RejectUserRequest;
import pe.morosos.auth.admin.dto.UserStatusRequest;
import pe.morosos.auth.admin.service.AdminUserService;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUsersController {
    private final AdminUserService adminUserService;

    public AdminUsersController(AdminUserService adminUserService) { this.adminUserService = adminUserService; }

    @GetMapping
    @PreAuthorize("hasAuthority('USUARIOS_VER_LISTADO')")
    public List<AdminUserResponse> list() { return adminUserService.list(); }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USUARIOS_VER_DETALLE')")
    public AdminUserResponse get(@PathVariable UUID id) { return adminUserService.get(id); }

    @PostMapping
    @PreAuthorize("hasAuthority('USUARIOS_CREAR')")
    public AdminUserResponse create(@Valid @RequestBody AdminUserRequest request, HttpServletRequest httpRequest) {
        return adminUserService.create(request, httpRequest);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USUARIOS_EDITAR')")
    public AdminUserResponse update(@PathVariable UUID id, @Valid @RequestBody AdminUserRequest request, HttpServletRequest httpRequest) {
        return adminUserService.update(id, request, httpRequest);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('USUARIOS_ACTIVAR_DESACTIVAR')")
    public AdminUserResponse status(@PathVariable UUID id, @Valid @RequestBody UserStatusRequest request, HttpServletRequest httpRequest) {
        return adminUserService.changeStatus(id, request, httpRequest);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('USUARIOS_APROBAR')")
    public AdminUserResponse approve(@PathVariable UUID id, @RequestBody(required = false) ApproveUserRequest request, HttpServletRequest httpRequest) {
        return adminUserService.approve(id, request, httpRequest);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('USUARIOS_RECHAZAR')")
    public AdminUserResponse reject(@PathVariable UUID id, @RequestBody(required = false) RejectUserRequest request, HttpServletRequest httpRequest) {
        return adminUserService.reject(id, request, httpRequest);
    }
}

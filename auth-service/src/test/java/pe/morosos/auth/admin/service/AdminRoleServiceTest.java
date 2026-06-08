package pe.morosos.auth.admin.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.morosos.auth.admin.dto.RoleRequest;
import pe.morosos.auth.admin.dto.RoleStatusRequest;
import pe.morosos.auth.exception.AuthBusinessException;
import pe.morosos.auth.permission.repository.PermisoRepository;
import pe.morosos.auth.role.entity.Rol;
import pe.morosos.auth.role.repository.RolPermisoRepository;
import pe.morosos.auth.role.repository.RolRepository;
import pe.morosos.auth.service.AuthAuditService;

@ExtendWith(MockitoExtension.class)
class AdminRoleServiceTest {

    @Mock private RolRepository rolRepository;
    @Mock private PermisoRepository permisoRepository;
    @Mock private RolPermisoRepository rolPermisoRepository;
    @Mock private AuthAuditService authAuditService;

    @InjectMocks
    private AdminRoleService adminRoleService;

    @Test
    void updateBlocksAdminRename() {
        UUID roleId = UUID.randomUUID();
        Rol adminRole = adminRole(roleId);
        RoleRequest request = new RoleRequest("ADMIN_EDITADO", "Administrador", "Base", List.of(
                "ROLES_EDITAR",
                "ROLES_ASIGNAR_PERMISOS",
                "USUARIOS_EDITAR",
                "USUARIOS_ASIGNAR_ROLES",
                "USUARIOS_ASIGNAR_PERMISOS"
        ));

        when(rolRepository.findById(roleId)).thenReturn(Optional.of(adminRole));

        assertThatThrownBy(() -> adminRoleService.update(roleId, request, mock(HttpServletRequest.class)))
                .isInstanceOf(AuthBusinessException.class)
                .hasMessageContaining("codigo del rol ADMIN");
    }

    @Test
    void updateBlocksAdminCriticalPermissionRemoval() {
        UUID roleId = UUID.randomUUID();
        Rol adminRole = adminRole(roleId);
        RoleRequest request = new RoleRequest("ADMIN", "Administrador", "Base", List.of("ROLES_EDITAR"));

        when(rolRepository.findById(roleId)).thenReturn(Optional.of(adminRole));

        assertThatThrownBy(() -> adminRoleService.update(roleId, request, mock(HttpServletRequest.class)))
                .isInstanceOf(AuthBusinessException.class)
                .hasMessageContaining("permisos criticos");
    }

    @Test
    void changeStatusBlocksAdminDeactivation() {
        UUID roleId = UUID.randomUUID();
        Rol adminRole = adminRole(roleId);

        when(rolRepository.findById(roleId)).thenReturn(Optional.of(adminRole));

        assertThatThrownBy(() -> adminRoleService.changeStatus(roleId, new RoleStatusRequest(false), mock(HttpServletRequest.class)))
                .isInstanceOf(AuthBusinessException.class)
                .hasMessageContaining("no puede desactivarse");
    }

    private Rol adminRole(UUID id) {
        Rol rol = new Rol();
        rol.setId(id);
        rol.setCodigo("ADMIN");
        rol.setNombre("Administrador");
        rol.setActivo(true);
        return rol;
    }
}

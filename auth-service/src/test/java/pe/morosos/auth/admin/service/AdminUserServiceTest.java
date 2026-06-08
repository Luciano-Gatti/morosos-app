package pe.morosos.auth.admin.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import pe.morosos.auth.admin.dto.AdminUserRequest;
import pe.morosos.auth.dto.UserAuthorities;
import pe.morosos.auth.exception.AuthBusinessException;
import pe.morosos.auth.role.entity.Rol;
import pe.morosos.auth.role.repository.RolPermisoRepository;
import pe.morosos.auth.role.repository.RolRepository;
import pe.morosos.auth.security.AuthPrincipal;
import pe.morosos.auth.service.AuthAuditService;
import pe.morosos.auth.service.AuthService;
import pe.morosos.auth.service.UserAuthorityService;
import pe.morosos.auth.user.entity.EstadoUsuario;
import pe.morosos.auth.user.entity.Usuario;
import pe.morosos.auth.user.repository.UsuarioPermisoRepository;
import pe.morosos.auth.user.repository.UsuarioRepository;
import pe.morosos.auth.user.repository.UsuarioRolRepository;
import pe.morosos.auth.permission.repository.PermisoRepository;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private RolRepository rolRepository;
    @Mock private PermisoRepository permisoRepository;
    @Mock private UsuarioRolRepository usuarioRolRepository;
    @Mock private UsuarioPermisoRepository usuarioPermisoRepository;
    @Mock private RolPermisoRepository rolPermisoRepository;
    @Mock private UserAuthorityService userAuthorityService;
    @Mock private AuthService authService;
    @Mock private AuthAuditService authAuditService;

    @InjectMocks
    private AdminUserService adminUserService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void updateBlocksSelfRemovalOfAdminRole() {
        UUID userId = UUID.randomUUID();
        Usuario usuario = user(userId);
        AdminUserRequest request = new AdminUserRequest("admin", "admin@test.com", "Admin", "Local", EstadoUsuario.ACTIVO, List.of("SUPERVISOR"), List.of());
        Rol supervisor = role(UUID.randomUUID(), "SUPERVISOR");

        SecurityContextHolder.getContext().setAuthentication(authentication(userId));
        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(usuario));
        when(userAuthorityService.resolveAuthorities(userId)).thenReturn(new UserAuthorities(List.of("ADMIN"), List.of("USUARIOS_EDITAR", "USUARIOS_ASIGNAR_ROLES", "USUARIOS_ASIGNAR_PERMISOS", "ROLES_EDITAR", "ROLES_ASIGNAR_PERMISOS")));
        when(rolRepository.findByCodigo("SUPERVISOR")).thenReturn(Optional.of(supervisor));

        assertThatThrownBy(() -> adminUserService.update(userId, request, mock(HttpServletRequest.class)))
                .isInstanceOf(AuthBusinessException.class)
                .hasMessageContaining("rol ADMIN");

        verify(usuarioRolRepository, never()).deleteByUsuarioId(any());
    }

    @Test
    void updateBlocksSelfRemovalOfCriticalPermissionGrantedByRole() {
        UUID userId = UUID.randomUUID();
        Usuario usuario = user(userId);
        AdminUserRequest request = new AdminUserRequest("admin", "admin@test.com", "Admin", "Local", EstadoUsuario.ACTIVO, List.of("ADMIN"), List.of("USUARIOS_EDITAR", "USUARIOS_ASIGNAR_ROLES", "USUARIOS_ASIGNAR_PERMISOS"));
        Rol adminRole = role(UUID.randomUUID(), "ADMIN");

        SecurityContextHolder.getContext().setAuthentication(authentication(userId));
        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(usuario));
        when(userAuthorityService.resolveAuthorities(userId)).thenReturn(new UserAuthorities(List.of("ADMIN"), List.of("USUARIOS_EDITAR", "USUARIOS_ASIGNAR_ROLES", "USUARIOS_ASIGNAR_PERMISOS", "ROLES_EDITAR", "ROLES_ASIGNAR_PERMISOS")));
        when(rolRepository.findByCodigo("ADMIN")).thenReturn(Optional.of(adminRole));
        when(rolPermisoRepository.findActivePermissionCodesByRolId(adminRole.getId())).thenReturn(List.of("USUARIOS_EDITAR", "USUARIOS_ASIGNAR_ROLES", "USUARIOS_ASIGNAR_PERMISOS"));

        assertThatThrownBy(() -> adminUserService.update(userId, request, mock(HttpServletRequest.class)))
                .isInstanceOf(AuthBusinessException.class)
                .hasMessageContaining("permiso critico ROLES_EDITAR");
    }

    private UsernamePasswordAuthenticationToken authentication(UUID userId) {
        AuthPrincipal principal = new AuthPrincipal(userId, "admin", "admin@test.com", List.of("ADMIN"), List.of(), 0L);
        return new UsernamePasswordAuthenticationToken(principal, null, List.of());
    }

    private Usuario user(UUID id) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setUsername("admin");
        usuario.setEmail("admin@test.com");
        usuario.setNombre("Admin");
        usuario.setApellido("Local");
        usuario.setEstado(EstadoUsuario.ACTIVO);
        return usuario;
    }

    private Rol role(UUID id, String codigo) {
        Rol rol = new Rol();
        rol.setId(id);
        rol.setCodigo(codigo);
        rol.setActivo(true);
        return rol;
    }
}

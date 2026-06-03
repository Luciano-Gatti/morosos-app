package pe.morosos.auth.admin.service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.auth.admin.dto.AdminUserRequest;
import pe.morosos.auth.admin.dto.AdminUserResponse;
import pe.morosos.auth.admin.dto.ApproveUserRequest;
import pe.morosos.auth.admin.dto.RejectUserRequest;
import pe.morosos.auth.admin.dto.UserStatusRequest;
import pe.morosos.auth.dto.UserAuthorities;
import pe.morosos.auth.exception.AuthBusinessException;
import pe.morosos.auth.permission.entity.Permiso;
import pe.morosos.auth.permission.repository.PermisoRepository;
import pe.morosos.auth.role.entity.Rol;
import pe.morosos.auth.role.repository.RolRepository;
import pe.morosos.auth.service.AuthAuditService;
import pe.morosos.auth.service.AuthService;
import pe.morosos.auth.service.UserAuthorityService;
import pe.morosos.auth.user.entity.EstadoUsuario;
import pe.morosos.auth.user.entity.Usuario;
import pe.morosos.auth.user.entity.UsuarioPermiso;
import pe.morosos.auth.user.entity.UsuarioRol;
import pe.morosos.auth.user.repository.UsuarioPermisoRepository;
import pe.morosos.auth.user.repository.UsuarioRepository;
import pe.morosos.auth.user.repository.UsuarioRolRepository;

@Service
public class AdminUserService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;
    private final UsuarioRolRepository usuarioRolRepository;
    private final UsuarioPermisoRepository usuarioPermisoRepository;
    private final UserAuthorityService userAuthorityService;
    private final AuthService authService;
    private final AuthAuditService authAuditService;

    public AdminUserService(UsuarioRepository usuarioRepository, RolRepository rolRepository, PermisoRepository permisoRepository,
                            UsuarioRolRepository usuarioRolRepository, UsuarioPermisoRepository usuarioPermisoRepository,
                            UserAuthorityService userAuthorityService, AuthService authService, AuthAuditService authAuditService) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.permisoRepository = permisoRepository;
        this.usuarioRolRepository = usuarioRolRepository;
        this.usuarioPermisoRepository = usuarioPermisoRepository;
        this.userAuthorityService = userAuthorityService;
        this.authService = authService;
        this.authAuditService = authAuditService;
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> list() {
        return usuarioRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AdminUserResponse get(UUID id) {
        return toResponse(findUser(id));
    }

    @Transactional
    public AdminUserResponse create(AdminUserRequest request, HttpServletRequest httpRequest) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();
        authService.ensureUniqueUsernameAndEmail(username, email);
        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setNombre(request.nombre().trim());
        usuario.setApellido(request.apellido().trim());
        usuario.setEstado(request.estado() == null ? EstadoUsuario.PENDIENTE_APROBACION : request.estado());
        usuario.setEmailVerificado(false);
        usuario.setCreatedBy("admin");
        usuario.setUpdatedBy("admin");
        usuarioRepository.save(usuario);
        assignRoles(usuario, request.roles());
        assignPermissions(usuario, request.permissions());
        authAuditService.recordAuthEvent("USER_CREATED_BY_ADMIN", usuario, httpRequest, safeAuthoritiesJson(request.roles(), request.permissions()));
        return toResponse(usuario);
    }

    @Transactional
    public AdminUserResponse update(UUID id, AdminUserRequest request, HttpServletRequest httpRequest) {
        Usuario usuario = findUser(id);
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();
        usuarioRepository.findByUsernameIgnoreCase(username).filter(u -> !u.getId().equals(id)).ifPresent(u -> { throw conflict("USERNAME_ALREADY_EXISTS", "El username ya está registrado."); });
        usuarioRepository.findByEmailIgnoreCase(email).filter(u -> !u.getId().equals(id)).ifPresent(u -> { throw conflict("EMAIL_ALREADY_EXISTS", "El email ya está registrado."); });
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setNombre(request.nombre().trim());
        usuario.setApellido(request.apellido().trim());
        if (request.estado() != null) usuario.setEstado(request.estado());
        usuario.setUpdatedBy("admin");
        assignRoles(usuario, request.roles());
        assignPermissions(usuario, request.permissions());
        authAuditService.recordAuthEvent("USER_ROLES_UPDATED", usuario, httpRequest, safeAuthoritiesJson(request.roles(), List.of()));
        authAuditService.recordAuthEvent("USER_PERMISSIONS_UPDATED", usuario, httpRequest, safeAuthoritiesJson(List.of(), request.permissions()));
        return toResponse(usuario);
    }

    @Transactional
    public AdminUserResponse changeStatus(UUID id, UserStatusRequest request, HttpServletRequest httpRequest) {
        Usuario usuario = findUser(id);
        usuario.setEstado(request.estado());
        usuario.setUpdatedBy("admin");
        authAuditService.recordAuthEvent("USER_STATUS_CHANGED", usuario, httpRequest, "{\"estado\":\"" + request.estado() + "\"}");
        return toResponse(usuario);
    }

    @Transactional
    public AdminUserResponse approve(UUID id, ApproveUserRequest request, HttpServletRequest httpRequest) {
        Usuario usuario = findUser(id);
        if (usuario.getEstado() != EstadoUsuario.PENDIENTE_APROBACION) {
            throw new AuthBusinessException(HttpStatus.BAD_REQUEST, "USER_NOT_PENDING_APPROVAL", "El usuario no está pendiente de aprobación.");
        }
        assignRoles(usuario, request == null ? List.of() : request.roles());
        assignPermissions(usuario, request == null ? List.of() : request.permissions());
        usuario.setEstado(EstadoUsuario.ACTIVO);
        usuario.setUpdatedBy("admin");
        authAuditService.recordAuthEvent("USER_APPROVED", usuario, httpRequest, request == null ? null : safeAuthoritiesJson(request.roles(), request.permissions()));
        return toResponse(usuario);
    }

    @Transactional
    public AdminUserResponse reject(UUID id, RejectUserRequest request, HttpServletRequest httpRequest) {
        Usuario usuario = findUser(id);
        usuario.setEstado(EstadoUsuario.RECHAZADO);
        usuario.setUpdatedBy("admin");
        String motivo = request == null || request.motivo() == null ? "" : request.motivo().replace("\"", "'");
        authAuditService.recordAuthEvent("USER_REJECTED", usuario, httpRequest, "{\"motivo\":\"" + motivo + "\"}");
        return toResponse(usuario);
    }

    private void assignRoles(Usuario usuario, List<String> roleCodes) {
        usuarioRolRepository.deleteByUsuarioId(usuario.getId());
        if (roleCodes == null) return;
        roleCodes.stream().distinct().forEach(code -> {
            Rol rol = rolRepository.findByCodigo(code).filter(Rol::isActivo)
                    .orElseThrow(() -> new AuthBusinessException(HttpStatus.BAD_REQUEST, "ROLE_NOT_FOUND", "Rol activo no encontrado: " + code));
            UsuarioRol usuarioRol = new UsuarioRol();
            usuarioRol.setUsuario(usuario);
            usuarioRol.setRol(rol);
            usuarioRolRepository.save(usuarioRol);
        });
    }

    private void assignPermissions(Usuario usuario, List<String> permissionCodes) {
        usuarioPermisoRepository.deleteByUsuarioId(usuario.getId());
        if (permissionCodes == null) return;
        permissionCodes.stream().distinct().forEach(code -> {
            Permiso permiso = permisoRepository.findByCodigo(code).filter(Permiso::isActivo)
                    .orElseThrow(() -> new AuthBusinessException(HttpStatus.BAD_REQUEST, "PERMISSION_NOT_FOUND", "Permiso activo no encontrado: " + code));
            UsuarioPermiso usuarioPermiso = new UsuarioPermiso();
            usuarioPermiso.setUsuario(usuario);
            usuarioPermiso.setPermiso(permiso);
            usuarioPermiso.setActivo(true);
            usuarioPermiso.setCreatedBy("admin");
            usuarioPermiso.setUpdatedBy("admin");
            usuarioPermisoRepository.save(usuarioPermiso);
        });
    }

    private AdminUserResponse toResponse(Usuario usuario) {
        UserAuthorities authorities = userAuthorityService.resolveAuthorities(usuario.getId());
        return new AdminUserResponse(usuario.getId(), usuario.getUsername(), usuario.getEmail(), usuario.getNombre(), usuario.getApellido(),
                usuario.isActivo(), usuario.getEstado(), usuario.isEmailVerificado(), authorities.roles(), authorities.permissions(),
                usuario.getCreatedAt(), usuario.getUpdatedAt());
    }

    private Usuario findUser(UUID id) {
        return usuarioRepository.findById(id).orElseThrow(() -> new AuthBusinessException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado."));
    }

    private AuthBusinessException conflict(String code, String message) { return new AuthBusinessException(HttpStatus.CONFLICT, code, message); }

    private String safeAuthoritiesJson(List<String> roles, List<String> permissions) {
        return "{\"roles\":" + quoteList(roles) + ",\"permissions\":" + quoteList(permissions) + "}";
    }

    private String quoteList(List<String> values) {
        if (values == null) return "[]";
        return values.stream().map(v -> "\"" + v.replace("\"", "'") + "\"").toList().toString();
    }
}

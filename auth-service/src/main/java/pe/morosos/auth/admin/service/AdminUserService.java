package pe.morosos.auth.admin.service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
import pe.morosos.auth.role.repository.RolPermisoRepository;
import pe.morosos.auth.role.repository.RolRepository;
import pe.morosos.auth.security.AuthPrincipal;
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

    private static final String ADMIN_ROLE_CODE = "ADMIN";
    private static final Set<String> SELF_PROTECTED_PERMISSIONS = Set.of(
            "ROLES_EDITAR",
            "ROLES_ASIGNAR_PERMISOS",
            "USUARIOS_EDITAR",
            "USUARIOS_ASIGNAR_ROLES",
            "USUARIOS_ASIGNAR_PERMISOS"
    );

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;
    private final UsuarioRolRepository usuarioRolRepository;
    private final UsuarioPermisoRepository usuarioPermisoRepository;
    private final RolPermisoRepository rolPermisoRepository;
    private final UserAuthorityService userAuthorityService;
    private final AuthService authService;
    private final AuthAuditService authAuditService;

    public AdminUserService(
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PermisoRepository permisoRepository,
            UsuarioRolRepository usuarioRolRepository,
            UsuarioPermisoRepository usuarioPermisoRepository,
            RolPermisoRepository rolPermisoRepository,
            UserAuthorityService userAuthorityService,
            AuthService authService,
            AuthAuditService authAuditService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.permisoRepository = permisoRepository;
        this.usuarioRolRepository = usuarioRolRepository;
        this.usuarioPermisoRepository = usuarioPermisoRepository;
        this.rolPermisoRepository = rolPermisoRepository;
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
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        validateOptionalSingleRole(request.roles());
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
        usuarioRepository.incrementAuthVersion(usuario.getId());
        authAuditService.recordAuthEvent("USER_CREATED_BY_ADMIN", usuario, httpRequest, safeAuthoritiesJson(request.roles(), request.permissions()));
        return toResponse(usuario);
    }

    @Transactional
    public AdminUserResponse update(UUID id, AdminUserRequest request, HttpServletRequest httpRequest) {
        Usuario usuario = findUser(id);
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        validateOptionalSingleRole(request.roles());
        validateSelfProtection(usuario, request.roles(), request.permissions());

        usuarioRepository.findByUsernameIgnoreCase(username)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw conflict("USERNAME_ALREADY_EXISTS", "El username ya esta registrado.");
                });
        usuarioRepository.findByEmailIgnoreCase(email)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw conflict("EMAIL_ALREADY_EXISTS", "El email ya esta registrado.");
                });

        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setNombre(request.nombre().trim());
        usuario.setApellido(request.apellido().trim());
        if (request.estado() != null) {
            usuario.setEstado(request.estado());
        }
        usuario.setUpdatedBy("admin");

        assignRoles(usuario, request.roles());
        assignPermissions(usuario, request.permissions());
        usuarioRepository.incrementAuthVersion(usuario.getId());
        authAuditService.recordAuthEvent("USER_ROLES_UPDATED", usuario, httpRequest, safeAuthoritiesJson(request.roles(), List.of()));
        authAuditService.recordAuthEvent("USER_PERMISSIONS_UPDATED", usuario, httpRequest, safeAuthoritiesJson(List.of(), request.permissions()));
        return toResponse(usuario);
    }

    @Transactional
    public AdminUserResponse changeStatus(UUID id, UserStatusRequest request, HttpServletRequest httpRequest) {
        Usuario usuario = findUser(id);
        usuario.setEstado(request.estado());
        usuario.setUpdatedBy("admin");
        usuarioRepository.incrementAuthVersion(usuario.getId());
        authAuditService.recordAuthEvent("USER_STATUS_CHANGED", usuario, httpRequest, "{\"estado\":\"" + request.estado() + "\"}");
        return toResponse(usuario);
    }

    @Transactional
    public AdminUserResponse approve(UUID id, ApproveUserRequest request, HttpServletRequest httpRequest) {
        Usuario usuario = findUser(id);
        if (usuario.getEstado() != EstadoUsuario.PENDIENTE_APROBACION) {
            throw new AuthBusinessException(HttpStatus.BAD_REQUEST, "USER_NOT_PENDING_APPROVAL", "El usuario no esta pendiente de aprobacion.");
        }

        List<String> roles = request == null ? List.of() : request.roles();
        validateRequiredSingleRole(roles);

        assignRoles(usuario, roles);
        assignPermissions(usuario, request == null ? List.of() : request.permissions());
        usuario.setEstado(EstadoUsuario.ACTIVO);
        usuario.setUpdatedBy("admin");
        usuarioRepository.incrementAuthVersion(usuario.getId());
        authAuditService.recordAuthEvent("USER_APPROVED", usuario, httpRequest, request == null ? null : safeAuthoritiesJson(request.roles(), request.permissions()));
        return toResponse(usuario);
    }

    @Transactional
    public AdminUserResponse reject(UUID id, RejectUserRequest request, HttpServletRequest httpRequest) {
        Usuario usuario = findUser(id);
        usuario.setEstado(EstadoUsuario.RECHAZADO);
        usuario.setUpdatedBy("admin");
        usuarioRepository.incrementAuthVersion(usuario.getId());
        String motivo = request == null || request.motivo() == null ? "" : request.motivo().replace("\"", "'");
        authAuditService.recordAuthEvent("USER_REJECTED", usuario, httpRequest, "{\"motivo\":\"" + motivo + "\"}");
        return toResponse(usuario);
    }

    private void assignRoles(Usuario usuario, List<String> roleCodes) {
        usuarioRolRepository.deleteByUsuarioId(usuario.getId());
        if (roleCodes == null) {
            return;
        }

        roleCodes.stream().distinct().forEach(code -> {
            Rol rol = rolRepository.findByCodigo(code)
                    .filter(Rol::isActivo)
                    .orElseThrow(() -> new AuthBusinessException(HttpStatus.BAD_REQUEST, "ROLE_NOT_FOUND", "Rol activo no encontrado: " + code));
            UsuarioRol usuarioRol = new UsuarioRol();
            usuarioRol.setUsuario(usuario);
            usuarioRol.setRol(rol);
            usuarioRolRepository.save(usuarioRol);
        });
    }

    private void assignPermissions(Usuario usuario, List<String> permissionCodes) {
        usuarioPermisoRepository.deleteByUsuarioId(usuario.getId());
        if (permissionCodes == null) {
            return;
        }

        permissionCodes.stream().distinct().forEach(code -> {
            Permiso permiso = permisoRepository.findByCodigo(code)
                    .filter(Permiso::isActivo)
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

    private void validateSelfProtection(Usuario usuario, List<String> requestedRoles, List<String> requestedPermissions) {
        UUID currentUserId = currentUserId();
        if (currentUserId == null || !currentUserId.equals(usuario.getId())) {
            return;
        }

        UserAuthorities currentAuthorities = userAuthorityService.resolveAuthorities(currentUserId);
        Set<String> nextRoles = normalizeCodes(requestedRoles);
        Set<String> nextPermissions = resolveEffectivePermissions(nextRoles, requestedPermissions);

        if (currentAuthorities.roles().stream().map(this::normalizeCode).anyMatch(ADMIN_ROLE_CODE::equals)
                && !nextRoles.contains(ADMIN_ROLE_CODE)) {
            throw selfLockout("No puedes quitarte a ti mismo el rol ADMIN.");
        }

        for (String permissionCode : SELF_PROTECTED_PERMISSIONS) {
            boolean currentlyHasPermission = currentAuthorities.permissions().stream()
                    .map(this::normalizeCode)
                    .anyMatch(permissionCode::equals);
            if (currentlyHasPermission && !nextPermissions.contains(permissionCode)) {
                throw selfLockout("No puedes quitarte a ti mismo el permiso critico " + permissionCode + ".");
            }
        }
    }

    private Set<String> resolveEffectivePermissions(Set<String> roleCodes, List<String> directPermissions) {
        Set<String> permissions = new HashSet<>(normalizeCodes(directPermissions));
        for (String roleCode : roleCodes) {
            Rol rol = rolRepository.findByCodigo(roleCode)
                    .filter(Rol::isActivo)
                    .orElseThrow(() -> new AuthBusinessException(HttpStatus.BAD_REQUEST, "ROLE_NOT_FOUND", "Rol activo no encontrado: " + roleCode));
            permissions.addAll(rolPermisoRepository.findActivePermissionCodesByRolId(rol.getId()).stream()
                    .map(this::normalizeCode)
                    .toList());
        }
        return permissions;
    }

    private Set<String> normalizeCodes(List<String> values) {
        if (values == null) {
            return Set.of();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(this::normalizeCode)
                .collect(java.util.stream.Collectors.toSet());
    }

    private String normalizeCode(String value) {
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthPrincipal authPrincipal) {
            return authPrincipal.userId();
        }
        return null;
    }

    private AdminUserResponse toResponse(Usuario usuario) {
        UserAuthorities authorities = userAuthorityService.resolveAuthorities(usuario.getId());
        return new AdminUserResponse(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.isActivo(),
                usuario.getEstado(),
                usuario.isEmailVerificado(),
                authorities.roles(),
                authorities.permissions(),
                usuario.getCreatedAt(),
                usuario.getUpdatedAt()
        );
    }

    private Usuario findUser(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new AuthBusinessException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado."));
    }

    private void validateOptionalSingleRole(List<String> roleCodes) {
        if (roleCodes == null) {
            return;
        }

        long distinctRoles = roleCodes.stream()
                .filter(code -> code != null && !code.isBlank())
                .map(String::trim)
                .distinct()
                .count();
        if (distinctRoles > 1) {
            throw new AuthBusinessException(HttpStatus.BAD_REQUEST, "USER_ROLE_LIMIT_EXCEEDED", "Solo se puede asignar un rol por usuario.");
        }
    }

    private void validateRequiredSingleRole(List<String> roleCodes) {
        validateOptionalSingleRole(roleCodes);
        long distinctRoles = roleCodes == null
                ? 0
                : roleCodes.stream()
                        .filter(code -> code != null && !code.isBlank())
                        .map(String::trim)
                        .distinct()
                        .count();
        if (distinctRoles != 1) {
            throw new AuthBusinessException(HttpStatus.BAD_REQUEST, "USER_ROLE_REQUIRED", "Debes asignar exactamente un rol para aprobar al usuario.");
        }
    }

    private AuthBusinessException conflict(String code, String message) {
        return new AuthBusinessException(HttpStatus.CONFLICT, code, message);
    }

    private AuthBusinessException selfLockout(String message) {
        return new AuthBusinessException(HttpStatus.BAD_REQUEST, "SELF_LOCKOUT_NOT_ALLOWED", message);
    }

    private String safeAuthoritiesJson(List<String> roles, List<String> permissions) {
        return "{\"roles\":" + quoteList(roles) + ",\"permissions\":" + quoteList(permissions) + "}";
    }

    private String quoteList(List<String> values) {
        if (values == null) {
            return "[]";
        }
        return values.stream().map(value -> "\"" + value.replace("\"", "'") + "\"").toList().toString();
    }
}

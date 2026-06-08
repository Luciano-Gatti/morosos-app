package pe.morosos.auth.admin.service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.auth.admin.dto.RoleRequest;
import pe.morosos.auth.admin.dto.RoleResponse;
import pe.morosos.auth.admin.dto.RoleStatusRequest;
import pe.morosos.auth.exception.AuthBusinessException;
import pe.morosos.auth.permission.entity.Permiso;
import pe.morosos.auth.permission.repository.PermisoRepository;
import pe.morosos.auth.role.entity.Rol;
import pe.morosos.auth.role.entity.RolPermiso;
import pe.morosos.auth.role.repository.RolPermisoRepository;
import pe.morosos.auth.role.repository.RolRepository;
import pe.morosos.auth.service.AuthAuditService;
import pe.morosos.auth.user.repository.UsuarioRepository;
import pe.morosos.auth.user.repository.UsuarioRolRepository;

@Service
public class AdminRoleService {
    private static final String ADMIN_ROLE_CODE = "ADMIN";
    private static final Set<String> SYSTEM_ROLE_CODES = Set.of("ADMIN", "SUPERVISOR", "OPERADOR", "CONSULTA", "AUDITOR");
    private static final Set<String> ADMIN_REQUIRED_PERMISSIONS = Set.of(
            "ROLES_EDITAR",
            "ROLES_ASIGNAR_PERMISOS",
            "USUARIOS_EDITAR",
            "USUARIOS_ASIGNAR_ROLES",
            "USUARIOS_ASIGNAR_PERMISOS"
    );

    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;
    private final RolPermisoRepository rolPermisoRepository;
    private final AuthAuditService authAuditService;
    private final UsuarioRolRepository usuarioRolRepository;
    private final UsuarioRepository usuarioRepository;

    public AdminRoleService(
            RolRepository rolRepository,
            PermisoRepository permisoRepository,
            RolPermisoRepository rolPermisoRepository,
            AuthAuditService authAuditService,
            UsuarioRolRepository usuarioRolRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.rolRepository = rolRepository;
        this.permisoRepository = permisoRepository;
        this.rolPermisoRepository = rolPermisoRepository;
        this.authAuditService = authAuditService;
        this.usuarioRolRepository = usuarioRolRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> list(boolean includeInactive) {
        List<Rol> roles = includeInactive
                ? rolRepository.findAll(Sort.by(Sort.Direction.ASC, "codigo"))
                : rolRepository.findByActivoTrueOrderByCodigo();
        return roles.stream().map(this::toResponse).toList();
    }

    @Transactional
    public RoleResponse create(RoleRequest request, HttpServletRequest httpRequest) {
        String codigo = normalizeRoleCode(request.codigo());
        if (rolRepository.existsByCodigo(codigo)) {
            throw conflict("ROLE_ALREADY_EXISTS", "Ya existe un rol con ese codigo.");
        }

        Rol rol = new Rol();
        rol.setCodigo(codigo);
        rol.setNombre(normalizeRequiredText(request.nombre(), "ROLE_NAME_REQUIRED", "El nombre del rol es obligatorio."));
        rol.setDescripcion(normalizeOptionalText(request.descripcion()));
        rol.setActivo(true);
        rol.setCreatedBy("admin");
        rol.setUpdatedBy("admin");
        rolRepository.save(rol);

        List<String> permissionCodes = normalizePermissionCodes(request.permissions());
        assignPermissions(rol, permissionCodes);
        authAuditService.recordAuthEvent("ROLE_CREATED", null, httpRequest, safePermissionsJson(permissionCodes));
        return toResponse(rol);
    }

    @Transactional
    public RoleResponse update(UUID id, RoleRequest request, HttpServletRequest httpRequest) {
        Rol rol = findRole(id);
        String codigo = normalizeRoleCode(request.codigo());
        validateProtectedAdminRoleUpdate(rol, codigo, request.permissions());
        rolRepository.findByCodigo(codigo)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw conflict("ROLE_ALREADY_EXISTS", "Ya existe un rol con ese codigo.");
                });

        rol.setCodigo(codigo);
        rol.setNombre(normalizeRequiredText(request.nombre(), "ROLE_NAME_REQUIRED", "El nombre del rol es obligatorio."));
        rol.setDescripcion(normalizeOptionalText(request.descripcion()));
        rol.setUpdatedBy("admin");

        List<String> permissionCodes = normalizePermissionCodes(request.permissions());
        assignPermissions(rol, permissionCodes);
        bumpAuthVersionForRoleUsers(rol.getId());
        authAuditService.recordAuthEvent("ROLE_UPDATED", null, httpRequest, safePermissionsJson(permissionCodes));
        return toResponse(rol);
    }

    @Transactional
    public RoleResponse changeStatus(UUID id, RoleStatusRequest request, HttpServletRequest httpRequest) {
        Rol rol = findRole(id);
        if (isAdminRole(rol) && !request.activo()) {
            throw badRequest("ADMIN_ROLE_REQUIRED", "El rol ADMIN no puede desactivarse.");
        }
        rol.setActivo(request.activo());
        rol.setUpdatedBy("admin");
        bumpAuthVersionForRoleUsers(rol.getId());
        authAuditService.recordAuthEvent("ROLE_STATUS_CHANGED", null, httpRequest, "{\"activo\":" + request.activo() + "}");
        return toResponse(rol);
    }

    private void bumpAuthVersionForRoleUsers(UUID rolId) {
        usuarioRolRepository.findUsuarioIdsByRolId(rolId).forEach(usuarioRepository::incrementAuthVersion);
    }

    private void validateProtectedAdminRoleUpdate(Rol rol, String requestedCode, List<String> requestedPermissions) {
        if (!isAdminRole(rol)) {
            return;
        }
        if (!ADMIN_ROLE_CODE.equals(requestedCode)) {
            throw badRequest("ADMIN_ROLE_REQUIRED", "El codigo del rol ADMIN no puede modificarse.");
        }

        List<String> normalizedPermissions = normalizePermissionCodes(requestedPermissions);
        if (normalizedPermissions.isEmpty()) {
            throw badRequest("ADMIN_ROLE_REQUIRED", "El rol ADMIN no puede quedar sin permisos.");
        }
        if (!normalizedPermissions.containsAll(ADMIN_REQUIRED_PERMISSIONS)) {
            throw badRequest("ADMIN_ROLE_REQUIRED", "El rol ADMIN debe conservar sus permisos criticos.");
        }
    }

    private boolean isAdminRole(Rol rol) {
        return ADMIN_ROLE_CODE.equalsIgnoreCase(rol.getCodigo());
    }

    private boolean isSystemRole(Rol rol) {
        return SYSTEM_ROLE_CODES.contains(rol.getCodigo().toUpperCase(Locale.ROOT));
    }

    private void assignPermissions(Rol rol, List<String> permissionCodes) {
        rolPermisoRepository.deleteByRolId(rol.getId());
        for (String code : permissionCodes) {
            Permiso permiso = permisoRepository.findByCodigo(code)
                    .filter(Permiso::isActivo)
                    .orElseThrow(() -> new AuthBusinessException(HttpStatus.BAD_REQUEST, "PERMISSION_NOT_FOUND", "Permiso activo no encontrado: " + code));

            RolPermiso rolPermiso = new RolPermiso();
            rolPermiso.setRol(rol);
            rolPermiso.setPermiso(permiso);
            rolPermisoRepository.save(rolPermiso);
        }
    }

    private RoleResponse toResponse(Rol rol) {
        List<String> permissions = rolPermisoRepository.findActivePermissionCodesByRolId(rol.getId());
        return new RoleResponse(rol.getId(), rol.getCodigo(), rol.getNombre(), rol.getDescripcion(), rol.isActivo(), isSystemRole(rol), permissions);
    }

    private Rol findRole(UUID id) {
        return rolRepository.findById(id)
                .orElseThrow(() -> new AuthBusinessException(HttpStatus.NOT_FOUND, "ROLE_NOT_FOUND", "Rol no encontrado."));
    }

    private List<String> normalizePermissionCodes(List<String> permissionCodes) {
        if (permissionCodes == null) return List.of();
        return permissionCodes.stream()
                .map(this::normalizePermissionCode)
                .distinct()
                .toList();
    }

    private String normalizeRoleCode(String value) {
        String code = normalizeRequiredText(value, "ROLE_CODE_REQUIRED", "El codigo del rol es obligatorio.")
                .toUpperCase(Locale.ROOT);
        if (!code.matches("[A-Z0-9_]+")) {
            throw badRequest("ROLE_CODE_INVALID", "El codigo del rol solo puede contener letras, numeros y guiones bajos.");
        }
        return code;
    }

    private String normalizePermissionCode(String value) {
        return normalizeRequiredText(value, "PERMISSION_CODE_REQUIRED", "El codigo del permiso es obligatorio.")
                .toUpperCase(Locale.ROOT);
    }

    private String normalizeRequiredText(String value, String code, String message) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isBlank()) {
            throw badRequest(code, message);
        }
        return normalized;
    }

    private String normalizeOptionalText(String value) {
        String normalized = value == null ? "" : value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private AuthBusinessException badRequest(String code, String message) {
        return new AuthBusinessException(HttpStatus.BAD_REQUEST, code, message);
    }

    private AuthBusinessException conflict(String code, String message) {
        return new AuthBusinessException(HttpStatus.CONFLICT, code, message);
    }

    private String safePermissionsJson(List<String> permissions) {
        return "{\"permissions\":" + quoteList(permissions) + "}";
    }

    private String quoteList(List<String> values) {
        if (values == null) return "[]";
        return values.stream().map(value -> "\"" + value.replace("\"", "'") + "\"").toList().toString();
    }
}

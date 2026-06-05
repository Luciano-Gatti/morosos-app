package pe.morosos.auth.service;

import java.util.List;
import java.util.TreeSet;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.auth.dto.AuthUserResponse;
import pe.morosos.auth.dto.UserAuthorities;
import pe.morosos.auth.user.entity.Usuario;
import pe.morosos.auth.user.repository.UsuarioPermisoRepository;
import pe.morosos.auth.user.repository.UsuarioRolRepository;

@Service
public class UserAuthorityService {

    private final UsuarioRolRepository usuarioRolRepository;
    private final UsuarioPermisoRepository usuarioPermisoRepository;

    public UserAuthorityService(UsuarioRolRepository usuarioRolRepository, UsuarioPermisoRepository usuarioPermisoRepository) {
        this.usuarioRolRepository = usuarioRolRepository;
        this.usuarioPermisoRepository = usuarioPermisoRepository;
    }

    @Transactional(readOnly = true)
    public UserAuthorities resolveAuthorities(UUID usuarioId) {
        List<String> roles = usuarioRolRepository.findActiveRoleCodesByUsuarioId(usuarioId);
        TreeSet<String> effectivePermissions = new TreeSet<>(usuarioRolRepository.findActivePermissionCodesByUsuarioId(usuarioId));
        effectivePermissions.addAll(usuarioPermisoRepository.findActivePermissionCodesByUsuarioId(usuarioId));
        return new UserAuthorities(List.copyOf(roles), List.copyOf(effectivePermissions));
    }

    @Transactional(readOnly = true)
    public AuthUserResponse toResponse(Usuario usuario) {
        UserAuthorities authorities = resolveAuthorities(usuario.getId());
        return new AuthUserResponse(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getApellido(),
                authorities.roles(),
                authorities.permissions()
        );
    }
}

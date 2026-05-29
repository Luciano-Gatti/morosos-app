package pe.morosos.auth.service;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.auth.dto.AuthUserResponse;
import pe.morosos.auth.dto.UserAuthorities;
import pe.morosos.auth.user.entity.Usuario;
import pe.morosos.auth.user.repository.UsuarioRolRepository;

@Service
public class UserAuthorityService {

    private final UsuarioRolRepository usuarioRolRepository;

    public UserAuthorityService(UsuarioRolRepository usuarioRolRepository) {
        this.usuarioRolRepository = usuarioRolRepository;
    }

    @Transactional(readOnly = true)
    public UserAuthorities resolveAuthorities(UUID usuarioId) {
        List<String> roles = usuarioRolRepository.findActiveRoleCodesByUsuarioId(usuarioId);
        List<String> permissions = usuarioRolRepository.findActivePermissionCodesByUsuarioId(usuarioId);
        return new UserAuthorities(List.copyOf(roles), List.copyOf(permissions));
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

package pe.morosos.auth.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import pe.morosos.auth.role.entity.Rol;
import pe.morosos.auth.role.repository.RolRepository;
import pe.morosos.auth.user.entity.Usuario;
import pe.morosos.auth.user.entity.UsuarioRol;
import pe.morosos.auth.user.repository.UsuarioRepository;
import pe.morosos.auth.user.repository.UsuarioRolRepository;

@Component
public class AdminDevInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminDevInitializer.class);
    private static final String ADMIN_ROLE_CODE = "ADMIN";
    private static final String SYSTEM_ACTOR = "auth-seed-admin";

    private final AdminSeedProperties properties;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final UsuarioRolRepository usuarioRolRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminDevInitializer(
            AdminSeedProperties properties,
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            UsuarioRolRepository usuarioRolRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.properties = properties;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.usuarioRolRepository = usuarioRolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }

        if (!StringUtils.hasText(properties.password())) {
            log.warn("AUTH_SEED_ADMIN_ENABLED=true pero AUTH_SEED_ADMIN_PASSWORD está vacío; no se creará el admin dev.");
            return;
        }

        String username = requireText(properties.username(), "AUTH_SEED_ADMIN_USERNAME");
        String email = requireText(properties.email(), "AUTH_SEED_ADMIN_EMAIL");
        String nombre = StringUtils.hasText(properties.nombre()) ? properties.nombre().trim() : "Administrador";
        String apellido = StringUtils.hasText(properties.apellido()) ? properties.apellido().trim() : "Local";

        Rol adminRole = rolRepository.findByCodigo(ADMIN_ROLE_CODE)
                .orElseThrow(() -> new IllegalStateException("No existe el rol ADMIN requerido por el admin dev initializer."));

        Usuario usuario = usuarioRepository.findByUsernameIgnoreCase(username)
                .or(() -> usuarioRepository.findByEmailIgnoreCase(email))
                .orElseGet(() -> createAdminUser(username, email, nombre, apellido));

        if (!usuarioRolRepository.existsByUsuarioIdAndRolId(usuario.getId(), adminRole.getId())) {
            UsuarioRol usuarioRol = new UsuarioRol();
            usuarioRol.setUsuario(usuario);
            usuarioRol.setRol(adminRole);
            usuarioRolRepository.save(usuarioRol);
        }

        log.info("Admin dev initializer verificado para usuario '{}'.", usuario.getUsername());
    }

    private Usuario createAdminUser(String username, String email, String nombre, String apellido) {
        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setNombre(nombre);
        usuario.setApellido(apellido);
        usuario.setActivo(true);
        usuario.setEmailVerificado(true);
        usuario.setPasswordHash(passwordEncoder.encode(properties.password()));
        usuario.setCreatedBy(SYSTEM_ACTOR);
        usuario.setUpdatedBy(SYSTEM_ACTOR);
        return usuarioRepository.save(usuario);
    }

    private String requireText(String value, String propertyName) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(propertyName + " no puede estar vacío cuando el admin dev initializer está habilitado.");
        }
        return value.trim();
    }
}

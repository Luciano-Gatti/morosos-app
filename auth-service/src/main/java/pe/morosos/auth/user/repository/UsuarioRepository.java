package pe.morosos.auth.user.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.morosos.auth.user.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByUsernameIgnoreCase(String username);

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    @Query("""
            select usuario from Usuario usuario
            where lower(usuario.username) = lower(:usernameOrEmail)
               or lower(usuario.email) = lower(:usernameOrEmail)
            """)
    Optional<Usuario> findByUsernameOrEmailIgnoreCase(@Param("usernameOrEmail") String usernameOrEmail);

    @Modifying
    @Query("""
            update Usuario usuario
            set usuario.authVersion = usuario.authVersion + 1
            where usuario.id = :usuarioId
            """)
    int incrementAuthVersion(@Param("usuarioId") UUID usuarioId);
}

package pe.morosos.auth.user.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.auth.user.entity.UsuarioRol;

public interface UsuarioRolRepository extends JpaRepository<UsuarioRol, UUID> {

    boolean existsByUsuarioIdAndRolId(UUID usuarioId, UUID rolId);
}

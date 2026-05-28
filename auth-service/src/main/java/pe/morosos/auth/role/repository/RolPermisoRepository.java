package pe.morosos.auth.role.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.auth.role.entity.RolPermiso;

public interface RolPermisoRepository extends JpaRepository<RolPermiso, UUID> {

    boolean existsByRolIdAndPermisoId(UUID rolId, UUID permisoId);
}

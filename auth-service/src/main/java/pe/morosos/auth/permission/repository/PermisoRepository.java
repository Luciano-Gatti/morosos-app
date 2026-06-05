package pe.morosos.auth.permission.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.auth.permission.entity.Permiso;

public interface PermisoRepository extends JpaRepository<Permiso, UUID> {

    Optional<Permiso> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    List<Permiso> findByActivoTrueOrderByCodigo();
}

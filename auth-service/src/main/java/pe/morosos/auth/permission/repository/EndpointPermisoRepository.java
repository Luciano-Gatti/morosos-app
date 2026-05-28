package pe.morosos.auth.permission.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.auth.permission.entity.EndpointPermiso;

public interface EndpointPermisoRepository extends JpaRepository<EndpointPermiso, UUID> {

    List<EndpointPermiso> findByServicioAndActivoTrue(String servicio);

    Optional<EndpointPermiso> findByServicioAndMetodoHttpAndPathPatternAndActivoTrue(
            String servicio,
            String metodoHttp,
            String pathPattern
    );

    boolean existsByServicioAndMetodoHttpAndPathPattern(String servicio, String metodoHttp, String pathPattern);
}

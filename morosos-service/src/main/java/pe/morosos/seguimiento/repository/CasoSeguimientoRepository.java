package pe.morosos.seguimiento.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.seguimiento.entity.CasoSeguimiento;
import pe.morosos.seguimiento.entity.CasoSeguimientoEstado;

public interface CasoSeguimientoRepository extends JpaRepository<CasoSeguimiento, UUID> {
    Optional<CasoSeguimiento> findByInmuebleIdAndEstado(UUID inmuebleId, CasoSeguimientoEstado estado);
    boolean existsByInmuebleIdAndEstado(UUID inmuebleId, CasoSeguimientoEstado estado);
    List<CasoSeguimiento> findByInmuebleIdOrderByFechaInicioDesc(UUID inmuebleId);
}

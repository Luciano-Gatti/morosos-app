package pe.morosos.seguimiento.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.morosos.seguimiento.entity.CasoSeguimiento;
import pe.morosos.seguimiento.entity.CasoSeguimientoEstado;

public interface CasoSeguimientoRepository extends JpaRepository<CasoSeguimiento, UUID> {
    Optional<CasoSeguimiento> findByInmuebleIdAndEstado(UUID inmuebleId, CasoSeguimientoEstado estado);
    boolean existsByInmuebleIdAndEstado(UUID inmuebleId, CasoSeguimientoEstado estado);
    List<CasoSeguimiento> findByInmuebleIdOrderByFechaInicioDesc(UUID inmuebleId);

    @Query("select c.etapaActual.id, count(c.id) from CasoSeguimiento c where c.etapaActual.id in :etapaIds group by c.etapaActual.id")
    List<Object[]> countByEtapaActualIds(List<UUID> etapaIds);
}

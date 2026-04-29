package pe.morosos.seguimiento.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.seguimiento.entity.ProcesoCierre;

public interface ProcesoCierreRepository extends JpaRepository<ProcesoCierre, UUID> {
    Optional<ProcesoCierre> findByCasoSeguimientoId(UUID casoSeguimientoId);
    boolean existsByCasoSeguimientoId(UUID casoSeguimientoId);
}

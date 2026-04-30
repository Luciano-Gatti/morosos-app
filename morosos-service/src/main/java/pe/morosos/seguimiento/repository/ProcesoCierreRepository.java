package pe.morosos.seguimiento.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.morosos.seguimiento.entity.ProcesoCierre;

public interface ProcesoCierreRepository extends JpaRepository<ProcesoCierre, UUID> {
    Optional<ProcesoCierre> findByCasoSeguimientoId(UUID casoSeguimientoId);
    boolean existsByCasoSeguimientoId(UUID casoSeguimientoId);

    @Query("select p.motivoCierre.id, count(p.id) from ProcesoCierre p where p.motivoCierre.id in :motivoIds group by p.motivoCierre.id")
    java.util.List<Object[]> countByMotivoIds(java.util.List<UUID> motivoIds);
}

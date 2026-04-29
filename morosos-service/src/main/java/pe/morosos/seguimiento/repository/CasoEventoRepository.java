package pe.morosos.seguimiento.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.seguimiento.entity.CasoEvento;

public interface CasoEventoRepository extends JpaRepository<CasoEvento, UUID> {
    List<CasoEvento> findByCasoSeguimientoIdOrderByFechaEventoAsc(UUID casoSeguimientoId);
    List<CasoEvento> findByCasoSeguimientoIdOrderByFechaEventoDesc(UUID casoSeguimientoId);
}

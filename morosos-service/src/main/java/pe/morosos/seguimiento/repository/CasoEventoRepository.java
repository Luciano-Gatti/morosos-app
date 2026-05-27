package pe.morosos.seguimiento.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.seguimiento.entity.CasoEvento;
import pe.morosos.seguimiento.entity.CasoEventoTipo;

public interface CasoEventoRepository extends JpaRepository<CasoEvento, UUID> {
    List<CasoEvento> findByCasoSeguimientoIdOrderByFechaEventoAsc(UUID casoSeguimientoId);
    List<CasoEvento> findByCasoSeguimientoIdOrderByFechaEventoDesc(UUID casoSeguimientoId);

    List<CasoEvento> findByCasoSeguimientoInmuebleIdAndTipoEventoOrderByFechaEventoAsc(UUID inmuebleId, CasoEventoTipo tipoEvento);

    List<CasoEvento> findByCasoSeguimientoInmuebleIdAndTipoEventoAndFechaEventoGreaterThanEqualAndFechaEventoLessThanOrderByFechaEventoAsc(UUID inmuebleId, CasoEventoTipo tipoEvento, Instant fechaDesde, Instant fechaHasta);
}

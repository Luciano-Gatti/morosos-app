package pe.morosos.seguimiento.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.seguimiento.entity.CompromisoPago;

public interface CompromisoPagoRepository extends JpaRepository<CompromisoPago, UUID> {
    List<CompromisoPago> findByCasoSeguimientoIdOrderByFechaDesdeDesc(UUID casoSeguimientoId);
}

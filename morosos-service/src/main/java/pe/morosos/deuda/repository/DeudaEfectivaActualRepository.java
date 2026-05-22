package pe.morosos.deuda.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.deuda.entity.DeudaEfectivaActual;

public interface DeudaEfectivaActualRepository extends JpaRepository<DeudaEfectivaActual, UUID> {
    Optional<DeudaEfectivaActual> findByInmuebleId(UUID inmuebleId);
    List<DeudaEfectivaActual> findByInmuebleIdIn(List<UUID> inmuebleIds);
}

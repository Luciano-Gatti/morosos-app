package pe.morosos.seguimiento.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.seguimiento.entity.ProcesoCierrePlanPago;

public interface ProcesoCierrePlanPagoRepository extends JpaRepository<ProcesoCierrePlanPago, UUID> {}

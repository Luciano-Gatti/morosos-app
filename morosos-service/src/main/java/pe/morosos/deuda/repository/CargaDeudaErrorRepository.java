package pe.morosos.deuda.repository;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.deuda.entity.CargaDeudaError;

public interface CargaDeudaErrorRepository extends JpaRepository<CargaDeudaError, UUID> {
    Page<CargaDeudaError> findByCargaDeudaId(UUID cargaDeudaId, Pageable pageable);
}

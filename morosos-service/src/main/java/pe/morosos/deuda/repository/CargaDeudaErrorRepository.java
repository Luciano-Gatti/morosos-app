package pe.morosos.deuda.repository;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pe.morosos.deuda.entity.CargaDeudaError;

public interface CargaDeudaErrorRepository extends JpaRepository<CargaDeudaError, UUID>, JpaSpecificationExecutor<CargaDeudaError> {
    Page<CargaDeudaError> findByCargaDeudaId(UUID cargaDeudaId, Pageable pageable);
}

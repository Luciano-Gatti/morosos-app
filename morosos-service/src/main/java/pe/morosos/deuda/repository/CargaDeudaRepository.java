package pe.morosos.deuda.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pe.morosos.deuda.entity.CargaDeuda;
import pe.morosos.deuda.entity.CargaDeudaEstado;

public interface CargaDeudaRepository extends JpaRepository<CargaDeuda, UUID>, JpaSpecificationExecutor<CargaDeuda> {
    Page<CargaDeuda> findByPeriodoAndEstado(LocalDate periodo, CargaDeudaEstado estado, Pageable pageable);
    Page<CargaDeuda> findByPeriodo(LocalDate periodo, Pageable pageable);
    Page<CargaDeuda> findByEstado(CargaDeudaEstado estado, Pageable pageable);
    Optional<CargaDeuda> findFirstByEstadoInOrderByCreatedAtDesc(List<CargaDeudaEstado> estados);
}

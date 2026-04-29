package pe.morosos.deuda.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.deuda.entity.CargaDeudaDetalle;
import java.util.List;
import java.math.BigDecimal;

public interface CargaDeudaDetalleRepository extends JpaRepository<CargaDeudaDetalle, UUID> {
    Page<CargaDeudaDetalle> findByCargaDeudaId(UUID cargaDeudaId, Pageable pageable);

    @Query("""
            select d.inmueble.id, d.cuotasVencidas, d.montoVencido
            from CargaDeudaDetalle d
            where d.cargaDeuda.id = :cargaId
            """)
    List<Object[]> findDeudaByCarga(UUID cargaId);
}

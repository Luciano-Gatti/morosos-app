package com.tuorg.morososcontrol.estadodeuda.infrastructure;

import com.tuorg.morososcontrol.estadodeuda.domain.EstadoDeudaHistorico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EstadoDeudaHistoricoRepository extends JpaRepository<EstadoDeudaHistorico, UUID> {

    List<EstadoDeudaHistorico> findByCargaDeudaId(UUID cargaDeudaId);

    List<EstadoDeudaHistorico> findByCargaDeudaIdOrderByInmuebleNumeroCuentaAsc(UUID cargaDeudaId);

    List<EstadoDeudaHistorico> findByInmuebleIdOrderByCargaDeudaFechaCargaAsc(UUID inmuebleId);

    List<EstadoDeudaHistorico> findAllByOrderByCargaDeudaFechaCargaAsc();

    long countByCargaDeudaId(UUID cargaDeudaId);

    boolean existsByCargaDeudaIdAndInmuebleId(UUID cargaDeudaId, UUID inmuebleId);
}

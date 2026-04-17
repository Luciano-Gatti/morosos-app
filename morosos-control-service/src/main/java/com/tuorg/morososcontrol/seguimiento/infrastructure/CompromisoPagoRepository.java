package com.tuorg.morososcontrol.seguimiento.infrastructure;

import com.tuorg.morososcontrol.seguimiento.domain.CompromisoPago;
import com.tuorg.morososcontrol.seguimiento.domain.EstadoCompromiso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CompromisoPagoRepository extends JpaRepository<CompromisoPago, UUID> {

    List<CompromisoPago> findByCasoSeguimientoIdOrderByFechaDesdeDesc(UUID casoSeguimientoId);

    List<CompromisoPago> findByCasoSeguimientoIdAndEstadoCompromiso(UUID casoSeguimientoId, EstadoCompromiso estadoCompromiso);
}

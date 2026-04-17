package com.tuorg.morososcontrol.seguimiento.infrastructure;

import com.tuorg.morososcontrol.seguimiento.domain.CasoSeguimiento;
import com.tuorg.morososcontrol.seguimiento.domain.EstadoSeguimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface CasoSeguimientoRepository extends JpaRepository<CasoSeguimiento, UUID> {

    boolean existsByInmuebleIdAndEstadoSeguimientoIn(UUID inmuebleId, Collection<EstadoSeguimiento> estados);

    List<CasoSeguimiento> findByInmuebleId(UUID inmuebleId);

    List<CasoSeguimiento> findByEstadoSeguimiento(EstadoSeguimiento estadoSeguimiento);
}

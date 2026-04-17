package com.tuorg.morososcontrol.seguimiento.infrastructure;

import com.tuorg.morososcontrol.seguimiento.domain.RegistroCorte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RegistroCorteRepository extends JpaRepository<RegistroCorte, UUID> {

    List<RegistroCorte> findByCasoSeguimientoIdOrderByFechaDesc(UUID casoSeguimientoId);

    boolean existsByMotivoCorteId(UUID motivoCorteId);
}

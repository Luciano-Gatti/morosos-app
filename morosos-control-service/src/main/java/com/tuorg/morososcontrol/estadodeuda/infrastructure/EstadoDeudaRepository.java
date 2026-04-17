package com.tuorg.morososcontrol.estadodeuda.infrastructure;

import com.tuorg.morososcontrol.estadodeuda.domain.EstadoDeuda;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EstadoDeudaRepository extends JpaRepository<EstadoDeuda, UUID> {

    Optional<EstadoDeuda> findByInmuebleId(UUID inmuebleId);

    boolean existsByInmuebleId(UUID inmuebleId);
}

package com.tuorg.morososcontrol.catalogo.infrastructure;

import com.tuorg.morososcontrol.catalogo.domain.MotivoCorte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MotivoCorteRepository extends JpaRepository<MotivoCorte, UUID> {

    List<MotivoCorte> findByActivoTrue();

    boolean existsByNombre(String nombre);

    boolean existsByNombreAndIdNot(String nombre, UUID id);
}

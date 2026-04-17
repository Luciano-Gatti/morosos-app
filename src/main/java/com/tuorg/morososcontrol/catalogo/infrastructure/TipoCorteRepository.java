package com.tuorg.morososcontrol.catalogo.infrastructure;

import com.tuorg.morososcontrol.catalogo.domain.TipoCorte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TipoCorteRepository extends JpaRepository<TipoCorte, UUID> {

    boolean existsByNombre(String nombre);

    boolean existsByNombreAndIdNot(String nombre, UUID id);
}

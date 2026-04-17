package com.tuorg.morososcontrol.grupo.infrastructure;

import com.tuorg.morososcontrol.grupo.domain.Grupo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GrupoRepository extends JpaRepository<Grupo, UUID> {

    Optional<Grupo> findByNombre(String nombre);

    boolean existsByNombre(String nombre);

    boolean existsByNombreAndIdNot(String nombre, UUID id);
}

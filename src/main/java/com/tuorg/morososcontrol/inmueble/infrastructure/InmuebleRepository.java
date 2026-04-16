package com.tuorg.morososcontrol.inmueble.infrastructure;

import com.tuorg.morososcontrol.inmueble.domain.Inmueble;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InmuebleRepository extends JpaRepository<Inmueble, UUID> {

    Optional<Inmueble> findByNumeroCuenta(String numeroCuenta);
}

package com.tuorg.morososcontrol.inmueble.infrastructure;

import com.tuorg.morososcontrol.inmueble.domain.Inmueble;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InmuebleRepository extends JpaRepository<Inmueble, UUID> {

    Optional<Inmueble> findByNumeroCuenta(String numeroCuenta);

    boolean existsByNumeroCuenta(String numeroCuenta);

    boolean existsByNumeroCuentaAndIdNot(String numeroCuenta, UUID id);

    List<Inmueble> findByNumeroCuentaContainingIgnoreCaseAndPropietarioNombreContainingIgnoreCaseAndDireccionCompletaContainingIgnoreCaseAndDistritoContainingIgnoreCase(
            String numeroCuenta,
            String propietarioNombre,
            String direccionCompleta,
            String distrito
    );
}

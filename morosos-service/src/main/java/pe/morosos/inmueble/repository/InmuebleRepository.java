package pe.morosos.inmueble.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pe.morosos.inmueble.entity.Inmueble;

public interface InmuebleRepository extends JpaRepository<Inmueble, UUID>, JpaSpecificationExecutor<Inmueble> {
    boolean existsByCuentaIgnoreCaseAndIdNot(String cuenta, UUID id);
    java.util.Optional<Inmueble> findByCuentaIgnoreCase(String cuenta);
}

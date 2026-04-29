package pe.morosos.distrito.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.distrito.entity.Distrito;

public interface DistritoRepository extends JpaRepository<Distrito, UUID> {
    java.util.Optional<Distrito> findByCodigoIgnoreCase(String codigo);
    boolean existsByCodigoIgnoreCase(String codigo);
    boolean existsByNombreIgnoreCase(String nombre);
    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, UUID id);
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, UUID id);
}

package pe.morosos.motivocierre.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.motivocierre.entity.MotivoCierre;

public interface MotivoCierreRepository extends JpaRepository<MotivoCierre, UUID> {
    boolean existsByCodigoIgnoreCase(String codigo);
    boolean existsByNombreIgnoreCase(String nombre);
    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, UUID id);
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, UUID id);
    java.util.Optional<pe.morosos.motivocierre.entity.MotivoCierre> findByCodigoIgnoreCase(String codigo);
}

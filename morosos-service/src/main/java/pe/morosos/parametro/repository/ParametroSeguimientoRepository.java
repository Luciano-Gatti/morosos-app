package pe.morosos.parametro.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.parametro.entity.ParametroSeguimiento;

public interface ParametroSeguimientoRepository extends JpaRepository<ParametroSeguimiento, UUID> {
    Optional<ParametroSeguimiento> findByCodigoIgnoreCase(String codigo);
}

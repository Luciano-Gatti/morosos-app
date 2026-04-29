package pe.morosos.grupo.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.grupo.entity.Grupo;

public interface GrupoRepository extends JpaRepository<Grupo, UUID> {
    boolean existsByCodigoIgnoreCase(String codigo);
    boolean existsByNombreIgnoreCase(String nombre);
    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, UUID id);
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, UUID id);
    Optional<Grupo> findByCodigoIgnoreCase(String codigo);
}

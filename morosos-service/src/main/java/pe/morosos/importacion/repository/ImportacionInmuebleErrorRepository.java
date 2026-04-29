package pe.morosos.importacion.repository;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.importacion.entity.ImportacionInmuebleError;

public interface ImportacionInmuebleErrorRepository extends JpaRepository<ImportacionInmuebleError, UUID> {
 Page<ImportacionInmuebleError> findByImportacionId(UUID importacionId, Pageable pageable);
}

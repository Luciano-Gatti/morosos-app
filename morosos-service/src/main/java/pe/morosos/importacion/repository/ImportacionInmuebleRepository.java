package pe.morosos.importacion.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.importacion.entity.ImportacionInmueble;

public interface ImportacionInmuebleRepository extends JpaRepository<ImportacionInmueble, UUID> {}

package pe.morosos.inmueble.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.grupodistrito.entity.GrupoDistritoConfig;

public interface GrupoDistritoConfigLookupRepository extends JpaRepository<GrupoDistritoConfig, UUID> {
    Optional<GrupoDistritoConfig> findByGrupoIdAndDistritoId(UUID grupoId, UUID distritoId);
}

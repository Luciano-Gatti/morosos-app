package pe.morosos.grupodistrito.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.grupodistrito.entity.GrupoDistritoConfig;

public interface GrupoDistritoConfigRepository extends JpaRepository<GrupoDistritoConfig, UUID> {
    boolean existsByGrupoIdAndDistritoIdAndIdNot(UUID grupoId, UUID distritoId, UUID id);
    boolean existsByGrupoIdAndDistritoId(UUID grupoId, UUID distritoId);
    java.util.Optional<pe.morosos.grupodistrito.entity.GrupoDistritoConfig> findByGrupoIdAndDistritoId(UUID grupoId, UUID distritoId);
}

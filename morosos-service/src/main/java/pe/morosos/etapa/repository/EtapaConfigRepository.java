package pe.morosos.etapa.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.etapa.entity.EtapaConfig;

public interface EtapaConfigRepository extends JpaRepository<EtapaConfig, UUID> {
    boolean existsByCodigoIgnoreCase(String codigo);
    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, UUID id);
    boolean existsByOrden(Integer orden);
    boolean existsByOrdenAndIdNot(Integer orden, UUID id);
    List<EtapaConfig> findAllByOrderByOrdenAsc();
    java.util.Optional<EtapaConfig> findFirstByActivoTrueOrderByOrdenAsc();
    java.util.Optional<EtapaConfig> findFirstByOrdenGreaterThanAndActivoTrueOrderByOrdenAsc(Integer orden);
}

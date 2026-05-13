package pe.morosos.inmueble.repository;

import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import pe.morosos.inmueble.entity.Inmueble;

public interface InmuebleRepository extends JpaRepository<Inmueble, UUID>, JpaSpecificationExecutor<Inmueble> {
    boolean existsByCuentaIgnoreCaseAndIdNot(String cuenta, UUID id);
    java.util.Optional<Inmueble> findByCuentaIgnoreCase(String cuenta);
    long countByGrupoIdAndDistritoId(UUID grupoId, UUID distritoId);

    @Query("""
       select i
       from Inmueble i
       left join fetch i.grupo
       left join fetch i.distrito
       where i.activo = true
   """)
    List<Inmueble> findActivosWithGrupoAndDistrito();
}

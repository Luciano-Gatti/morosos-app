package pe.morosos.auth.role.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.morosos.auth.role.entity.RolPermiso;

public interface RolPermisoRepository extends JpaRepository<RolPermiso, UUID> {

    boolean existsByRolIdAndPermisoId(UUID rolId, UUID permisoId);

    @Modifying
    @Query("delete from RolPermiso rp where rp.rol.id = :rolId")
    void deleteByRolId(@Param("rolId") UUID rolId);

    @Query("""
            select distinct p.codigo
            from RolPermiso rp
            join rp.permiso p
            where rp.rol.id = :rolId
              and p.activo = true
            order by p.codigo
            """)
    List<String> findActivePermissionCodesByRolId(@Param("rolId") UUID rolId);
}

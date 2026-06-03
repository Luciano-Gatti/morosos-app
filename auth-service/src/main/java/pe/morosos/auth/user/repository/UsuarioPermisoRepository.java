package pe.morosos.auth.user.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.morosos.auth.user.entity.UsuarioPermiso;

public interface UsuarioPermisoRepository extends JpaRepository<UsuarioPermiso, UUID> {

    @Query("""
            select distinct p.codigo
            from UsuarioPermiso up
            join up.permiso p
            where up.usuario.id = :usuarioId
              and up.activo = true
              and p.activo = true
            order by p.codigo
            """)
    List<String> findActivePermissionCodesByUsuarioId(@Param("usuarioId") UUID usuarioId);

    @Modifying
    @Query("delete from UsuarioPermiso up where up.usuario.id = :usuarioId")
    void deleteByUsuarioId(@Param("usuarioId") UUID usuarioId);
}

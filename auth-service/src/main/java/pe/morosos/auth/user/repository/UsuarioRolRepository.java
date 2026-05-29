package pe.morosos.auth.user.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.morosos.auth.user.entity.UsuarioRol;

public interface UsuarioRolRepository extends JpaRepository<UsuarioRol, UUID> {

    boolean existsByUsuarioIdAndRolId(UUID usuarioId, UUID rolId);

    @Query("""
            select distinct r.codigo
            from UsuarioRol ur
            join ur.rol r
            where ur.usuario.id = :usuarioId
              and r.activo = true
            order by r.codigo
            """)
    List<String> findActiveRoleCodesByUsuarioId(@Param("usuarioId") UUID usuarioId);

    @Query("""
            select distinct p.codigo
            from UsuarioRol ur
            join ur.rol r
            join RolPermiso rp on rp.rol = r
            join rp.permiso p
            where ur.usuario.id = :usuarioId
              and r.activo = true
              and p.activo = true
            order by p.codigo
            """)
    List<String> findActivePermissionCodesByUsuarioId(@Param("usuarioId") UUID usuarioId);
}

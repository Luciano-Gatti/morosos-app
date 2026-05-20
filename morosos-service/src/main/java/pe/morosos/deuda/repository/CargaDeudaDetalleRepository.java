package pe.morosos.deuda.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pe.morosos.deuda.entity.CargaDeudaDetalle;
import java.util.List;
import java.math.BigDecimal;
import pe.morosos.seguimiento.entity.CasoSeguimientoEstado;

public interface CargaDeudaDetalleRepository extends JpaRepository<CargaDeudaDetalle, UUID>, JpaSpecificationExecutor<CargaDeudaDetalle> {
    Page<CargaDeudaDetalle> findByCargaDeudaId(UUID cargaDeudaId, Pageable pageable);

    @Query("""
            select d.inmueble.id, d.cuotasVencidas, d.montoVencido
            from CargaDeudaDetalle d
            where d.cargaDeuda.id = :cargaId
            """)
    List<Object[]> findDeudaByCarga(UUID cargaId);

    @Query(value = """
            select
                d.inmueble.id as inmuebleId,
                d.inmueble.cuenta as cuenta,
                d.inmueble.titular as titular,
                d.inmueble.direccion as direccion,
                d.inmueble.grupo.id as grupoId,
                d.inmueble.grupo.nombre as grupoNombre,
                d.inmueble.distrito.id as distritoId,
                d.inmueble.distrito.nombre as distritoNombre,
                d.cuotasVencidas as cuotasAdeudadas,
                d.montoVencido as montoAdeudado,
                c.id as casoId,
                c.estado as estado,
                e.id as etapaActualId,
                e.nombre as etapaActualNombre,
                c.fechaUltimoMovimiento as fechaUltimoMovimiento,
                e.esFinal as etapaFinal
            from CargaDeudaDetalle d
            join d.inmueble i
            join GrupoDistritoConfig gdc on gdc.grupo.id = i.grupo.id and gdc.distrito.id = i.distrito.id
            left join CasoSeguimiento c on c.inmueble.id = i.id
                and c.fechaInicio = (select max(c2.fechaInicio) from CasoSeguimiento c2 where c2.inmueble.id = i.id)
            left join c.etapaActual e
            where d.cargaDeuda.id = :cargaId
              and i.activo = true
              and i.seguimientoHabilitado = true
              and gdc.seguimientoHabilitado = true
              and d.cuotasVencidas >= :minCuotas
              and (:grupoId is null or i.grupo.id = :grupoId)
              and (:distritoId is null or i.distrito.id = :distritoId)
              and (:etapaId is null or e.id = :etapaId)
              and (:estado is null or c.estado = :estado)
            """,
            countQuery = """
            select count(d.id)
            from CargaDeudaDetalle d
            join d.inmueble i
            join GrupoDistritoConfig gdc on gdc.grupo.id = i.grupo.id and gdc.distrito.id = i.distrito.id
            left join CasoSeguimiento c on c.inmueble.id = i.id
                and c.fechaInicio = (select max(c2.fechaInicio) from CasoSeguimiento c2 where c2.inmueble.id = i.id)
            left join c.etapaActual e
            where d.cargaDeuda.id = :cargaId
              and i.activo = true
              and i.seguimientoHabilitado = true
              and gdc.seguimientoHabilitado = true
              and d.cuotasVencidas >= :minCuotas
              and (:grupoId is null or i.grupo.id = :grupoId)
              and (:distritoId is null or i.distrito.id = :distritoId)
              and (:etapaId is null or e.id = :etapaId)
              and (:estado is null or c.estado = :estado)
            """)
    Page<SeguimientoBandejaProjection> findBandejaSinBusqueda(
            @Param("cargaId") UUID cargaId,
            @Param("grupoId") UUID grupoId,
            @Param("distritoId") UUID distritoId,
            @Param("etapaId") UUID etapaId,
            @Param("estado") CasoSeguimientoEstado estado,
            @Param("minCuotas") Integer minCuotas,
            Pageable pageable);

    @Query(value = """
            select
                d.inmueble.id as inmuebleId,
                d.inmueble.cuenta as cuenta,
                d.inmueble.titular as titular,
                d.inmueble.direccion as direccion,
                d.inmueble.grupo.id as grupoId,
                d.inmueble.grupo.nombre as grupoNombre,
                d.inmueble.distrito.id as distritoId,
                d.inmueble.distrito.nombre as distritoNombre,
                d.cuotasVencidas as cuotasAdeudadas,
                d.montoVencido as montoAdeudado,
                c.id as casoId,
                c.estado as estado,
                e.id as etapaActualId,
                e.nombre as etapaActualNombre,
                c.fechaUltimoMovimiento as fechaUltimoMovimiento,
                e.esFinal as etapaFinal
            from CargaDeudaDetalle d
            join d.inmueble i
            join GrupoDistritoConfig gdc on gdc.grupo.id = i.grupo.id and gdc.distrito.id = i.distrito.id
            left join CasoSeguimiento c on c.inmueble.id = i.id
                and c.fechaInicio = (select max(c2.fechaInicio) from CasoSeguimiento c2 where c2.inmueble.id = i.id)
            left join c.etapaActual e
            where d.cargaDeuda.id = :cargaId
              and i.activo = true
              and i.seguimientoHabilitado = true
              and gdc.seguimientoHabilitado = true
              and d.cuotasVencidas >= :minCuotas
              and (:grupoId is null or i.grupo.id = :grupoId)
              and (:distritoId is null or i.distrito.id = :distritoId)
              and (:etapaId is null or e.id = :etapaId)
              and (:estado is null or c.estado = :estado)
              and (
                    lower(i.cuenta) like :searchPattern or
                    lower(i.titular) like :searchPattern or
                    lower(i.direccion) like :searchPattern
              )
            """,
            countQuery = """
            select count(d.id)
            from CargaDeudaDetalle d
            join d.inmueble i
            join GrupoDistritoConfig gdc on gdc.grupo.id = i.grupo.id and gdc.distrito.id = i.distrito.id
            left join CasoSeguimiento c on c.inmueble.id = i.id
                and c.fechaInicio = (select max(c2.fechaInicio) from CasoSeguimiento c2 where c2.inmueble.id = i.id)
            left join c.etapaActual e
            where d.cargaDeuda.id = :cargaId
              and i.activo = true
              and i.seguimientoHabilitado = true
              and gdc.seguimientoHabilitado = true
              and d.cuotasVencidas >= :minCuotas
              and (:grupoId is null or i.grupo.id = :grupoId)
              and (:distritoId is null or i.distrito.id = :distritoId)
              and (:etapaId is null or e.id = :etapaId)
              and (:estado is null or c.estado = :estado)
              and (
                    lower(i.cuenta) like :searchPattern or
                    lower(i.titular) like :searchPattern or
                    lower(i.direccion) like :searchPattern
              )
            """)
    Page<SeguimientoBandejaProjection> findBandejaConBusqueda(
            @Param("cargaId") UUID cargaId,
            @Param("searchPattern") String searchPattern,
            @Param("grupoId") UUID grupoId,
            @Param("distritoId") UUID distritoId,
            @Param("etapaId") UUID etapaId,
            @Param("estado") CasoSeguimientoEstado estado,
            @Param("minCuotas") Integer minCuotas,
            Pageable pageable);

    interface SeguimientoBandejaProjection {
        UUID getInmuebleId(); String getCuenta(); String getTitular(); String getDireccion();
        UUID getGrupoId(); String getGrupoNombre(); UUID getDistritoId(); String getDistritoNombre();
        Integer getCuotasAdeudadas(); BigDecimal getMontoAdeudado(); UUID getCasoId();
        CasoSeguimientoEstado getEstado(); UUID getEtapaActualId(); String getEtapaActualNombre();
        java.time.Instant getFechaUltimoMovimiento(); Boolean getEtapaFinal();
    }
}

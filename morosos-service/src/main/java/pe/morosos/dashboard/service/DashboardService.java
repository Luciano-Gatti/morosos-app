package pe.morosos.dashboard.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.morosos.dashboard.dto.DashboardAccionesMesResponse;
import pe.morosos.dashboard.dto.DashboardDistritoResponse;
import pe.morosos.dashboard.dto.DashboardKpisResponse;
import pe.morosos.dashboard.dto.DashboardMovimientoResponse;
import pe.morosos.dashboard.dto.DashboardResumenResponse;
import pe.morosos.deuda.entity.CargaDeuda;
import pe.morosos.deuda.entity.CargaDeudaEstado;
import pe.morosos.deuda.repository.CargaDeudaRepository;
import pe.morosos.parametro.repository.ParametroSeguimientoRepository;
import pe.morosos.seguimiento.entity.CasoEventoTipo;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private static final int CUOTAS_MIN_DEFAULT = 2;
    private static final String PARAM_CUOTAS_MIN = "CUOTAS_MINIMAS_MOROSIDAD";

    private final CargaDeudaRepository cargaDeudaRepository;
    private final ParametroSeguimientoRepository parametroSeguimientoRepository;
    private final EntityManager entityManager;

    public DashboardResumenResponse resumen(LocalDate fechaDesde, LocalDate fechaHasta, UUID grupoId, UUID distritoId) {
        int cuotasMin = cuotasMinimas();
        Optional<CargaDeuda> cargaOpt = cargaDeudaRepository.findFirstByEstadoInOrderByCreatedAtDesc(
                List.of(CargaDeudaEstado.COMPLETADA, CargaDeudaEstado.COMPLETADA_CON_ERRORES));

        if (cargaOpt.isEmpty()) {
            return new DashboardResumenResponse(
                    new DashboardKpisResponse(0, 0, 0, 0, 0, BigDecimal.ZERO),
                    new DashboardAccionesMesResponse(0, 0, 0, 0, 0, 0, 0),
                    List.of(),
                    List.of());
        }

        UUID cargaId = cargaOpt.get().getId();
        Instant inicio = inicioRango(fechaDesde);
        Instant fin = finRango(fechaHasta);

        DashboardKpisResponse kpis = queryKpis(cargaId, cuotasMin, grupoId, distritoId);
        DashboardAccionesMesResponse acciones = queryAccionesMes(inicio, fin, grupoId, distritoId);
        List<DashboardDistritoResponse> distritos = queryDistritos(cargaId, cuotasMin, grupoId, distritoId, inicio, fin);
        List<DashboardMovimientoResponse> movimientos = queryMovimientos(inicio, fin, grupoId, distritoId);

        return new DashboardResumenResponse(kpis, acciones, distritos, movimientos);
    }

    private DashboardKpisResponse queryKpis(UUID cargaId, int minCuotas, UUID grupoId, UUID distritoId) {
        Object[] row = entityManager.createQuery("""
                select count(i.id),
                       sum(case when d.id is not null then 1 else 0 end),
                       sum(case when d.id is not null and d.cuotasVencidas >= :min then 1 else 0 end),
                       coalesce(sum(d.montoVencido), 0)
                from Inmueble i
                left join CargaDeudaDetalle d on d.inmueble.id = i.id and d.cargaDeuda.id = :cargaId
                where (:grupoId is null or i.grupo.id = :grupoId)
                  and (:distritoId is null or i.distrito.id = :distritoId)
                  and i.activo = true
                """, Object[].class)
                .setParameter("cargaId", cargaId)
                .setParameter("min", minCuotas)
                .setParameter("grupoId", grupoId)
                .setParameter("distritoId", distritoId)
                .getSingleResult();

        long total = ((Number) row[0]).longValue();
        long deudores = ((Number) row[1]).longValue();
        long morosos = ((Number) row[2]).longValue();
        BigDecimal monto = (BigDecimal) row[3];
        long alDia = Math.max(0, total - deudores);
        double porcentaje = total == 0 ? 0 : morosos * 100d / total;
        return new DashboardKpisResponse(total, alDia, deudores, morosos, porcentaje, monto);
    }

    private List<DashboardDistritoResponse> queryDistritos(UUID cargaId, int minCuotas, UUID grupoId, UUID distritoId,
                                                           Instant inicio, Instant fin) {
        List<Object[]> rows = entityManager.createQuery("""
                select dist.id, dist.nombre,
                       count(i.id),
                       sum(case when d.id is not null then 1 else 0 end),
                       sum(case when d.id is not null and d.cuotasVencidas >= :min then 1 else 0 end),
                       coalesce(sum(d.montoVencido), 0)
                from Inmueble i
                join i.distrito dist
                left join CargaDeudaDetalle d on d.inmueble.id = i.id and d.cargaDeuda.id = :cargaId
                where (:grupoId is null or i.grupo.id = :grupoId)
                  and (:distritoId is null or i.distrito.id = :distritoId)
                  and i.activo = true
                group by dist.id, dist.nombre
                order by dist.nombre asc
                """, Object[].class)
                .setParameter("cargaId", cargaId)
                .setParameter("min", minCuotas)
                .setParameter("grupoId", grupoId)
                .setParameter("distritoId", distritoId)
                .getResultList();

        Map<UUID, DistritosAccionAgg> accionesPorDistrito = queryAccionesPorDistrito(inicio, fin, grupoId, distritoId);

        List<DashboardDistritoResponse> out = new ArrayList<>();
        for (Object[] r : rows) {
            UUID distId = (UUID) r[0];
            DistritosAccionAgg agg = accionesPorDistrito.getOrDefault(distId, DistritosAccionAgg.ZERO);
            long total = ((Number) r[2]).longValue();
            long deudores = ((Number) r[3]).longValue();
            long morosos = ((Number) r[4]).longValue();
            long alDia = Math.max(0, total - deudores);
            double porcentaje = total == 0 ? 0 : morosos * 100d / total;
            out.add(new DashboardDistritoResponse(
                    distId,
                    (String) r[1],
                    total,
                    alDia,
                    deudores,
                    morosos,
                    porcentaje,
                    (BigDecimal) r[5],
                    agg.avisosDeuda,
                    agg.avisosCorte,
                    agg.intimaciones,
                    agg.cortes));
        }
        return out;
    }

    private DashboardAccionesMesResponse queryAccionesMes(Instant inicio, Instant fin, UUID grupoId, UUID distritoId) {
        Object[] eventos = entityManager.createQuery("""
                select
                    sum(case when e.tipoEvento = :inicioProceso then 1 else 0 end),
                    sum(case when e.tipoEvento = :avanceEtapa then 1 else 0 end),
                    sum(case when e.tipoEvento = :repeticionEtapa then 1 else 0 end),
                    sum(case when e.tipoEvento = :cierreProceso then 1 else 0 end),
                    sum(case when e.tipoEvento = :compromisoRegistrado then 1 else 0 end)
                from CasoEvento e
                join e.casoSeguimiento c
                join c.inmueble i
                where e.fechaEvento >= :inicio and e.fechaEvento < :fin
                  and (:grupoId is null or i.grupo.id = :grupoId)
                  and (:distritoId is null or i.distrito.id = :distritoId)
                """, Object[].class)
                .setParameter("inicioProceso", CasoEventoTipo.INICIO_PROCESO)
                .setParameter("avanceEtapa", CasoEventoTipo.AVANCE_ETAPA)
                .setParameter("repeticionEtapa", CasoEventoTipo.REPETICION_ETAPA)
                .setParameter("cierreProceso", CasoEventoTipo.CIERRE_PROCESO)
                .setParameter("compromisoRegistrado", CasoEventoTipo.COMPROMISO_REGISTRADO)
                .setParameter("inicio", inicio)
                .setParameter("fin", fin)
                .setParameter("grupoId", grupoId)
                .setParameter("distritoId", distritoId)
                .getSingleResult();

        long avisosDeuda = numberOrZero(eventos[0]);
        long avisosCorte = numberOrZero(eventos[1]);
        long intimaciones = numberOrZero(eventos[2]);
        long regularizaciones = countCierresPorMotivo("REGULARIZACION", inicio, fin, grupoId, distritoId);
        long planesPago = countPlanesPago(inicio, fin, grupoId, distritoId);
        long compromisos = numberOrZero(eventos[4]);

        return new DashboardAccionesMesResponse(
                avisosDeuda,
                avisosCorte,
                intimaciones,
                numberOrZero(eventos[3]),
                regularizaciones,
                planesPago,
                compromisos);
    }

    private Map<UUID, DistritosAccionAgg> queryAccionesPorDistrito(Instant inicio, Instant fin, UUID grupoId, UUID distritoId) {
        List<Object[]> rows = entityManager.createQuery("""
                select i.distrito.id,
                       sum(case when e.tipoEvento = :inicioProceso then 1 else 0 end),
                       sum(case when e.tipoEvento = :avanceEtapa then 1 else 0 end),
                       sum(case when e.tipoEvento = :repeticionEtapa then 1 else 0 end),
                       sum(case when e.tipoEvento = :cierreProceso then 1 else 0 end)
                from CasoEvento e
                join e.casoSeguimiento c
                join c.inmueble i
                where e.fechaEvento >= :inicio and e.fechaEvento < :fin
                  and (:grupoId is null or i.grupo.id = :grupoId)
                  and (:distritoId is null or i.distrito.id = :distritoId)
                group by i.distrito.id
                """, Object[].class)
                .setParameter("inicioProceso", CasoEventoTipo.INICIO_PROCESO)
                .setParameter("avanceEtapa", CasoEventoTipo.AVANCE_ETAPA)
                .setParameter("repeticionEtapa", CasoEventoTipo.REPETICION_ETAPA)
                .setParameter("cierreProceso", CasoEventoTipo.CIERRE_PROCESO)
                .setParameter("inicio", inicio)
                .setParameter("fin", fin)
                .setParameter("grupoId", grupoId)
                .setParameter("distritoId", distritoId)
                .getResultList();

        return rows.stream().collect(Collectors.toMap(
                r -> (UUID) r[0],
                r -> new DistritosAccionAgg(numberOrZero(r[1]), numberOrZero(r[2]), numberOrZero(r[3]), numberOrZero(r[4]))
        ));
    }

    private List<DashboardMovimientoResponse> queryMovimientos(Instant inicio, Instant fin, UUID grupoId, UUID distritoId) {
        TypedQuery<Object[]> q = entityManager.createQuery("""
                select e.fechaEvento, e.tipoEvento, i.cuenta, i.titular, coalesce(ed.nombre, eo.nombre), e.createdBy
                from CasoEvento e
                join e.casoSeguimiento c
                join c.inmueble i
                left join e.etapaDestino ed
                left join e.etapaOrigen eo
                where (:grupoId is null or i.grupo.id = :grupoId)
                  and (:distritoId is null or i.distrito.id = :distritoId)
                  and e.fechaEvento >= :inicio and e.fechaEvento < :fin
                order by e.fechaEvento desc
                """, Object[].class);
        q.setParameter("grupoId", grupoId);
        q.setParameter("distritoId", distritoId);
        q.setParameter("inicio", inicio);
        q.setParameter("fin", fin);
        q.setMaxResults(20);
        return q.getResultList().stream().map(r -> new DashboardMovimientoResponse(
                ((Instant) r[0]).atOffset(ZoneOffset.UTC),
                ((Enum<?>) r[1]).name(),
                (String) r[2],
                (String) r[3],
                (String) r[4],
                (UUID) r[5],
                "SEGUIMIENTO")).toList();
    }

    private long countCierresPorMotivo(String motivoCodigo, Instant inicio, Instant fin, UUID grupoId, UUID distritoId) {
        return entityManager.createQuery("""
                select count(p.id)
                from ProcesoCierre p
                join p.casoSeguimiento c
                join c.inmueble i
                join p.motivoCierre m
                where p.fechaCierre >= :inicio and p.fechaCierre < :fin
                  and upper(m.codigo) = upper(:motivoCodigo)
                  and (:grupoId is null or i.grupo.id = :grupoId)
                  and (:distritoId is null or i.distrito.id = :distritoId)
                """, Long.class)
                .setParameter("motivoCodigo", motivoCodigo)
                .setParameter("inicio", inicio)
                .setParameter("fin", fin)
                .setParameter("grupoId", grupoId)
                .setParameter("distritoId", distritoId)
                .getSingleResult();
    }

    private long countPlanesPago(Instant inicio, Instant fin, UUID grupoId, UUID distritoId) {
        return entityManager.createQuery("""
                select count(pp.id)
                from ProcesoCierrePlanPago pp
                join pp.procesoCierre p
                join p.casoSeguimiento c
                join c.inmueble i
                where pp.createdAt >= :inicio and pp.createdAt < :fin
                  and (:grupoId is null or i.grupo.id = :grupoId)
                  and (:distritoId is null or i.distrito.id = :distritoId)
                """, Long.class)
                .setParameter("inicio", inicio)
                .setParameter("fin", fin)
                .setParameter("grupoId", grupoId)
                .setParameter("distritoId", distritoId)
                .getSingleResult();
    }

    private int cuotasMinimas() {
        return parametroSeguimientoRepository.findByCodigoIgnoreCase(PARAM_CUOTAS_MIN)
                .map(p -> Integer.parseInt(p.getValor()))
                .orElse(CUOTAS_MIN_DEFAULT);
    }

    private Instant inicioRango(LocalDate desde) {
        LocalDate base = desde == null ? LocalDate.now(ZoneOffset.UTC).with(TemporalAdjusters.firstDayOfMonth()) : desde;
        return base.atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    private Instant finRango(LocalDate hasta) {
        LocalDate base = hasta == null ? LocalDate.now(ZoneOffset.UTC).plusMonths(1).with(TemporalAdjusters.firstDayOfMonth()) : hasta.plusDays(1);
        return base.atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    private long numberOrZero(Object n) {
        return n == null ? 0L : ((Number) n).longValue();
    }

    private record DistritosAccionAgg(long avisosDeuda, long avisosCorte, long intimaciones, long cortes) {
        private static final DistritosAccionAgg ZERO = new DistritosAccionAgg(0, 0, 0, 0);
    }
}

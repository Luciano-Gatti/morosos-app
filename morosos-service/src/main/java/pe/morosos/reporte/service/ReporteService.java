package pe.morosos.reporte.service;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.springframework.stereotype.Service;
import pe.morosos.audit.entity.AuditLog;
import pe.morosos.audit.repository.AuditLogRepository;
import pe.morosos.common.api.PageResponse;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.deuda.entity.CargaDeuda;
import pe.morosos.deuda.entity.CargaDeudaEstado;
import pe.morosos.deuda.repository.CargaDeudaDetalleRepository;
import pe.morosos.deuda.repository.CargaDeudaRepository;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.inmueble.repository.InmuebleRepository;
import pe.morosos.parametro.repository.ParametroSeguimientoRepository;
import pe.morosos.reporte.dto.*;

@Service
@RequiredArgsConstructor
public class ReporteService {
    private static final int CUOTAS_MIN_DEFAULT = 2;
    private static final String PARAM_CUOTAS_MIN = "CUOTAS_MINIMAS_MOROSIDAD";
    private final InmuebleRepository inmuebleRepository;
    private final CargaDeudaRepository cargaDeudaRepository;
    private final CargaDeudaDetalleRepository cargaDeudaDetalleRepository;
    private final ParametroSeguimientoRepository parametroSeguimientoRepository;
    private final AuditLogRepository auditLogRepository;
    private final EntityManager entityManager;

    public Object obtenerReporte(String reporteId, LocalDate fechaDesde, LocalDate fechaHasta, String action,
                                 String entityType, String tipoAccion, java.util.UUID grupoId, java.util.UUID distritoId, java.util.UUID actorId, Pageable pageable) {
        return switch (reporteId) {
            case "morosos-grupo-distrito" -> reporteMorososGrupoDistrito();
            case "estado-inmuebles" -> reporteEstadoInmuebles();
            case "historial-movimientos" -> reporteHistorialMovimientos(fechaDesde, fechaHasta, action, entityType, pageable);
            case "porcentajes-morosidad" -> reportePorcentajesMorosidad();
            case "acciones-fechas" -> reporteAccionesFechas(fechaDesde, fechaHasta, tipoAccion, grupoId, distritoId, actorId, pageable);
            case "acciones-regularizacion" -> reporteAccionesRegularizacion(fechaDesde, fechaHasta, grupoId, distritoId, pageable);
            default -> throw new ResourceNotFoundException("Reporte no encontrado: " + reporteId);
        };
    }
    // implementations abbreviated but complete
    private MorososGrupoDistritoResponse reporteMorososGrupoDistrito(){
        int min = cuotasMinimas(); List<Inmueble> activos = inmuebleRepository.findAll().stream().filter(Inmueble::isActivo).toList();
        Map<UUID,Object[]> deuda=deudaUltimaCarga();
        List<MorososGrupoDistritoRowResponse> filas=new ArrayList<>();
        Map<UUID,List<Inmueble>> porDist=activos.stream().collect(Collectors.groupingBy(i->i.getDistrito().getId()));
        Map<String,List<Inmueble>> porPar=activos.stream().collect(Collectors.groupingBy(i->i.getGrupo().getId()+"|"+i.getDistrito().getId()));
        long totalPad=activos.size(), totalDeu=0,totalMor=0; BigDecimal montoTotal=BigDecimal.ZERO;
        for(List<Inmueble> items:porPar.values()){Inmueble r=items.get(0); long p=items.size(),d=0,m=0; BigDecimal mt=BigDecimal.ZERO; for(Inmueble i:items){Object[] x=deuda.get(i.getId()); if(x!=null){d++; Integer c=(Integer)x[1]; BigDecimal b=(BigDecimal)x[2]; mt=mt.add(b==null?BigDecimal.ZERO:b); if(c!=null&&c>=min)m++;}} totalDeu+=d; totalMor+=m; montoTotal=montoTotal.add(mt); filas.add(new MorososGrupoDistritoRowResponse(r.getGrupo().getId(),r.getGrupo().getNombre(),r.getDistrito().getId(),r.getDistrito().getNombre(),p,d,m,p-m,p==0?0:m*100d/p,mt));}
        List<MorososGrupoDistritoDistritoResponse> porDistrito=new ArrayList<>();
        for(List<Inmueble> items:porDist.values()){Inmueble r=items.get(0); long p=items.size(),d=0,m=0; BigDecimal mt=BigDecimal.ZERO; for(Inmueble i:items){Object[] x=deuda.get(i.getId()); if(x!=null){d++; Integer c=(Integer)x[1]; BigDecimal b=(BigDecimal)x[2]; mt=mt.add(b==null?BigDecimal.ZERO:b); if(c!=null&&c>=min)m++;}} porDistrito.add(new MorososGrupoDistritoDistritoResponse(r.getDistrito().getId(),r.getDistrito().getNombre(),p,d,m,p-m,p==0?0:m*100d/p,mt));}
        return new MorososGrupoDistritoResponse(totalPad,totalDeu,totalMor,totalPad-totalMor,totalPad==0?0:totalMor*100d/totalPad,filas,porDistrito);
    }
    private EstadoInmueblesResponse reporteEstadoInmuebles(){List<Inmueble> all=inmuebleRepository.findAll(); long total=all.size(),act=all.stream().filter(Inmueble::isActivo).count(),hab=all.stream().filter(Inmueble::isSeguimientoHabilitado).count();
        var porGrupo=all.stream().collect(Collectors.groupingBy(i->i.getGrupo().getId()));
        List<EstadoInmueblesGrupoResponse> g=porGrupo.values().stream().map(v->{Inmueble r=v.get(0); long t=v.size(),a=v.stream().filter(Inmueble::isActivo).count(),h=v.stream().filter(Inmueble::isSeguimientoHabilitado).count(); return new EstadoInmueblesGrupoResponse(r.getGrupo().getId(),r.getGrupo().getNombre(),t,a,t-a,h,t-h);}).toList();
        var porDist=all.stream().collect(Collectors.groupingBy(i->i.getDistrito().getId()));
        List<EstadoInmueblesDistritoResponse> d=porDist.values().stream().map(v->{Inmueble r=v.get(0); long t=v.size(),a=v.stream().filter(Inmueble::isActivo).count(),h=v.stream().filter(Inmueble::isSeguimientoHabilitado).count(); return new EstadoInmueblesDistritoResponse(r.getDistrito().getId(),r.getDistrito().getNombre(),t,a,t-a,h,t-h);}).toList();
        return new EstadoInmueblesResponse(total,act,total-act,hab,total-hab,g,d);}    
    private PageResponse<MovimientoReporteResponse> reporteHistorialMovimientos(LocalDate desde, LocalDate hasta,String action,String entityType,Pageable pageable){Specification<AuditLog> s=Specification.where(null); if(desde!=null){Instant i=desde.atStartOfDay().toInstant(ZoneOffset.UTC); s=s.and((r,q,c)->c.greaterThanOrEqualTo(r.get("createdAt"),i));} if(hasta!=null){Instant i=hasta.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC); s=s.and((r,q,c)->c.lessThan(r.get("createdAt"),i));} if(action!=null&&!action.isBlank()) s=s.and((r,q,c)->c.equal(r.get("action"),action)); if(entityType!=null&&!entityType.isBlank()) s=s.and((r,q,c)->c.equal(r.get("entityType"),entityType));
        Page<MovimientoReporteResponse> m=auditLogRepository.findAll(s,pageable).map(a->new MovimientoReporteResponse(a.getCreatedAt()==null?null:a.getCreatedAt().atOffset(ZoneOffset.UTC),a.getAction(),a.getEntityType(),a.getEntityId(),a.getActorId(),"%s %s".formatted(a.getEntityType(),a.getAction()),a.getOldValues(),a.getNewValues())); return PageResponse.from(m);}    
    private PorcentajesMorosidadResponse reportePorcentajesMorosidad(){int min=cuotasMinimas(); List<Inmueble> activos=inmuebleRepository.findAll().stream().filter(Inmueble::isActivo).toList(); Map<UUID,Object[]> deuda=deudaUltimaCarga(); long con=0,mor=0; BigDecimal monto=BigDecimal.ZERO; for(Inmueble i:activos){Object[] x=deuda.get(i.getId()); if(x!=null){con++; Integer c=(Integer)x[1]; BigDecimal b=(BigDecimal)x[2]; monto=monto.add(b==null?BigDecimal.ZERO:b); if(c!=null&&c>=min)mor++;}}
        List<PorcentajesMorosidadDetalleResponse> pg=buildDetalle(activos,deuda,min,true); List<PorcentajesMorosidadDetalleResponse> pd=buildDetalle(activos,deuda,min,false); long t=activos.size(); return new PorcentajesMorosidadResponse(t,con,mor,t-mor,t==0?0:con*100d/t,t==0?0:mor*100d/t,t==0?0:(t-mor)*100d/t,monto,pg,pd);}    
    private List<PorcentajesMorosidadDetalleResponse> buildDetalle(List<Inmueble> activos,Map<UUID,Object[]> deuda,int min,boolean grupo){Map<UUID,List<Inmueble>> map=activos.stream().collect(Collectors.groupingBy(i->grupo?i.getGrupo().getId():i.getDistrito().getId())); List<PorcentajesMorosidadDetalleResponse> out=new ArrayList<>(); for(List<Inmueble> v:map.values()){Inmueble r=v.get(0); long t=v.size(),c=0,m=0; BigDecimal mt=BigDecimal.ZERO; for(Inmueble i:v){Object[] x=deuda.get(i.getId()); if(x!=null){c++; Integer cc=(Integer)x[1]; BigDecimal b=(BigDecimal)x[2]; mt=mt.add(b==null?BigDecimal.ZERO:b); if(cc!=null&&cc>=min)m++;}} out.add(new PorcentajesMorosidadDetalleResponse(grupo?r.getGrupo().getId():r.getDistrito().getId(),grupo?r.getGrupo().getNombre():r.getDistrito().getNombre(),t,c,m,t-m,t==0?0:c*100d/t,t==0?0:m*100d/t,t==0?0:(t-m)*100d/t,mt));} return out;}
    private int cuotasMinimas(){return parametroSeguimientoRepository.findByCodigoIgnoreCase(PARAM_CUOTAS_MIN).map(p->Integer.parseInt(p.getValor())).orElse(CUOTAS_MIN_DEFAULT);}    


    private AccionesFechasResponse reporteAccionesFechas(LocalDate fechaDesde, LocalDate fechaHasta, String tipoAccion, UUID grupoId, UUID distritoId, UUID actorId, Pageable pageable) {
        Instant inicio = (fechaDesde == null ? LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1) : fechaDesde).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant fin = (fechaHasta == null ? LocalDate.now(ZoneOffset.UTC) : fechaHasta.plusDays(1)).atStartOfDay().toInstant(ZoneOffset.UTC);

        List<Object[]> baseRows = entityManager.createQuery("""
                select e.fechaEvento, e.tipoEvento,
                       i.id, i.cuenta, i.titular,
                       c.id,
                       g.id, g.nombre,
                       d.id, d.nombre,
                       eo.id, eo.codigo, eo.nombre,
                       ed.id, ed.codigo, ed.nombre,
                       e.createdBy, e.observacion, mc.codigo
                from CasoEvento e
                join e.casoSeguimiento c
                join c.inmueble i
                join i.grupo g
                join i.distrito d
                left join e.etapaOrigen eo
                left join e.etapaDestino ed
                left join ProcesoCierre pc on pc.casoSeguimiento.id = c.id
                left join pc.motivoCierre mc
                where e.fechaEvento >= :inicio and e.fechaEvento < :fin
                  and (:grupoId is null or g.id = :grupoId)
                  and (:distritoId is null or d.id = :distritoId)
                  and (:actorId is null or e.createdBy = :actorId)
                order by e.fechaEvento desc
                """, Object[].class)
                .setParameter("inicio", inicio).setParameter("fin", fin)
                .setParameter("grupoId", grupoId).setParameter("distritoId", distritoId).setParameter("actorId", actorId)
                .getResultList();

        List<AccionesFechasDetalleResponse> mapped = baseRows.stream()
                .map(this::toDetalleAccionesFecha)
                .filter(r -> tipoAccion == null || tipoAccion.isBlank() || r.tipoAccion().equalsIgnoreCase(tipoAccion))
                .toList();

        long total = mapped.size();
        if (total == 0) {
            return new AccionesFechasResponse(
                    new AccionesFechasResumenResponse(0, 0, 0, null),
                    List.of(),
                    List.of(),
                    new PageResponse<>(List.of(), pageable.getPageNumber(), pageable.getPageSize(), 0, 0));
        }

        Map<String, Long> porTipoMap = mapped.stream().collect(Collectors.groupingBy(AccionesFechasDetalleResponse::tipoAccion, LinkedHashMap::new, Collectors.counting()));
        List<AccionesFechasPorTipoResponse> porTipo = porTipoMap.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .map(e -> new AccionesFechasPorTipoResponse(e.getKey(), labelTipoAccion(e.getKey()), e.getValue(), e.getValue() * 100d / total))
                .toList();

        List<AccionesFechasSerieDiariaResponse> serie = mapped.stream()
                .collect(Collectors.groupingBy(x -> x.fecha().toLocalDate(), TreeMap::new, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new AccionesFechasSerieDiariaResponse(e.getKey(), e.getValue()))
                .toList();

        String masFrecuente = porTipo.isEmpty() ? null : porTipo.get(0).tipoAccion();
        long actores = mapped.stream().map(AccionesFechasDetalleResponse::actorId).filter(Objects::nonNull).distinct().count();
        AccionesFechasResumenResponse resumen = new AccionesFechasResumenResponse(total, serie.size(), actores, masFrecuente);

        int from = Math.min((int) pageable.getOffset(), mapped.size());
        int to = Math.min(from + pageable.getPageSize(), mapped.size());
        int totalPages = pageable.getPageSize() == 0 ? 1 : (int) Math.ceil((double) mapped.size() / pageable.getPageSize());
        PageResponse<AccionesFechasDetalleResponse> detalle = new PageResponse<>(mapped.subList(from, to), pageable.getPageNumber(), pageable.getPageSize(), mapped.size(), totalPages);
        return new AccionesFechasResponse(resumen, porTipo, serie, detalle);
    }

    private AccionesFechasDetalleResponse toDetalleAccionesFecha(Object[] r) {
        Instant fecha = (Instant) r[0];
        String tipoEvento = ((Enum<?>) r[1]).name();
        String etapaOrigenCodigo = (String) r[11];
        String etapaDestinoCodigo = (String) r[14];
        String motivoCierreCodigo = (String) r[18];
        String tipoAccion = mapTipoAccion(tipoEvento, etapaOrigenCodigo, etapaDestinoCodigo, motivoCierreCodigo);
        return new AccionesFechasDetalleResponse(
                fecha.atOffset(ZoneOffset.UTC),
                tipoAccion,
                labelTipoAccion(tipoAccion),
                (String) r[3],
                (String) r[4],
                (UUID) r[2],
                (UUID) r[5],
                (UUID) r[6],
                (String) r[7],
                (UUID) r[8],
                (String) r[9],
                (UUID) r[10],
                (String) r[12],
                (UUID) r[13],
                (String) r[15],
                (UUID) r[16],
                (String) r[17]);
    }

    private String mapTipoAccion(String tipoEvento, String etapaOrigenCodigo, String etapaDestinoCodigo, String motivoCierreCodigo) {
        if ("REPETICION_ETAPA".equals(tipoEvento)) return "REPETICION_ETAPA";
        if ("OBSERVACION".equals(tipoEvento)) return "PAUSA";
        if ("CAMBIO_PARAMETRO".equals(tipoEvento)) return "REAPERTURA";
        if ("COMPROMISO_REGISTRADO".equals(tipoEvento)) return "COMPROMISO_PAGO";
        if ("CIERRE_PROCESO".equals(tipoEvento)) {
            if ("REGULARIZACION".equalsIgnoreCase(motivoCierreCodigo)) return "REGULARIZACION";
            if ("PLAN_DE_PAGO".equalsIgnoreCase(motivoCierreCodigo)) return "PLAN_DE_PAGO";
            return "CIERRE";
        }
        if ("AVANCE_ETAPA".equals(tipoEvento) || "INICIO_PROCESO".equals(tipoEvento)) {
            String codigo = (etapaDestinoCodigo != null ? etapaDestinoCodigo : etapaOrigenCodigo);
            String c = codigo == null ? "" : codigo.toUpperCase(Locale.ROOT);
            if (c.contains("AVISO_DEUDA")) return "AVISO_DEUDA";
            if (c.contains("INTIMACION")) return "INTIMACION";
            if (c.contains("AVISO_CORTE")) return "AVISO_CORTE";
            if (c.contains("CORTE")) return "CORTE";
        }
        return "CIERRE";
    }

    private String labelTipoAccion(String tipoAccion) {
        return switch (tipoAccion) {
            case "AVISO_DEUDA" -> "Aviso de deuda";
            case "INTIMACION" -> "Intimación";
            case "AVISO_CORTE" -> "Aviso de corte";
            case "CORTE" -> "Corte";
            case "REPETICION_ETAPA" -> "Repetición de etapa";
            case "PAUSA" -> "Pausa";
            case "REAPERTURA" -> "Reapertura";
            case "CIERRE" -> "Cierre";
            case "REGULARIZACION" -> "Regularización";
            case "PLAN_DE_PAGO" -> "Plan de pago";
            case "COMPROMISO_PAGO" -> "Compromiso de pago";
            default -> tipoAccion;
        };
    }

    private AccionesRegularizacionResponse reporteAccionesRegularizacion(LocalDate fechaDesde, LocalDate fechaHasta, UUID grupoId, UUID distritoId, Pageable pageable) {
        Instant inicio = (fechaDesde == null ? LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1) : fechaDesde).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant fin = (fechaHasta == null ? LocalDate.now(ZoneOffset.UTC) : fechaHasta.plusDays(1)).atStartOfDay().toInstant(ZoneOffset.UTC);

        List<AccionesRegularizacionItemRegularizacionResponse> regs = entityManager.createQuery("""
                select p.fechaCierre, i.cuenta, i.titular, i.id, c.id, g.id, g.nombre, d.id, d.nombre, p.createdBy, p.observacion
                from ProcesoCierre p
                join p.motivoCierre m
                join p.casoSeguimiento c
                join c.inmueble i
                join i.grupo g
                join i.distrito d
                where upper(m.codigo) = 'REGULARIZACION'
                  and p.fechaCierre >= :inicio and p.fechaCierre < :fin
                  and (:grupoId is null or g.id = :grupoId)
                  and (:distritoId is null or d.id = :distritoId)
                order by p.fechaCierre desc
                """, Object[].class)
                .setParameter("inicio", inicio).setParameter("fin", fin)
                .setParameter("grupoId", grupoId).setParameter("distritoId", distritoId)
                .getResultList().stream()
                .map(r -> new AccionesRegularizacionItemRegularizacionResponse(
                        ((Instant) r[0]).atOffset(ZoneOffset.UTC),
                        (String) r[1], (String) r[2], (UUID) r[3], (UUID) r[4],
                        (UUID) r[5], (String) r[6], (UUID) r[7], (String) r[8],
                        (UUID) r[9], (String) r[10]))
                .toList();

        List<AccionesRegularizacionItemPlanPagoResponse> planes = entityManager.createQuery("""
                select p.fechaCierre, i.cuenta, i.titular, i.id, c.id, g.id, g.nombre, d.id, d.nombre,
                       pp.cantidadCuotas, pp.fechaVencimientoPrimeraCuota, p.createdBy, p.observacion
                from ProcesoCierre p
                join p.motivoCierre m
                join p.casoSeguimiento c
                join c.inmueble i
                join i.grupo g
                join i.distrito d
                join ProcesoCierrePlanPago pp on pp.procesoCierre.id = p.id
                where upper(m.codigo) = 'PLAN_DE_PAGO'
                  and p.fechaCierre >= :inicio and p.fechaCierre < :fin
                  and (:grupoId is null or g.id = :grupoId)
                  and (:distritoId is null or d.id = :distritoId)
                order by p.fechaCierre desc
                """, Object[].class)
                .setParameter("inicio", inicio).setParameter("fin", fin)
                .setParameter("grupoId", grupoId).setParameter("distritoId", distritoId)
                .getResultList().stream()
                .map(r -> new AccionesRegularizacionItemPlanPagoResponse(
                        ((Instant) r[0]).atOffset(ZoneOffset.UTC),
                        (String) r[1], (String) r[2], (UUID) r[3], (UUID) r[4],
                        (UUID) r[5], (String) r[6], (UUID) r[7], (String) r[8],
                        (Integer) r[9], (LocalDate) r[10], (UUID) r[11], (String) r[12]))
                .toList();

        List<AccionesRegularizacionItemCompromisoResponse> compromisos = entityManager.createQuery("""
                select cp.fechaDesde, cp.fechaHasta, i.cuenta, i.titular, i.id, c.id, g.id, g.nombre, d.id, d.nombre,
                       cp.estado, cp.montoComprometido, cp.createdBy, cp.observacion
                from CompromisoPago cp
                join cp.casoSeguimiento c
                join c.inmueble i
                join i.grupo g
                join i.distrito d
                where cp.fechaDesde >= :fechaDesde and cp.fechaDesde <= :fechaHasta
                  and (:grupoId is null or g.id = :grupoId)
                  and (:distritoId is null or d.id = :distritoId)
                order by cp.fechaDesde desc
                """, Object[].class)
                .setParameter("fechaDesde", inicio.atOffset(ZoneOffset.UTC).toLocalDate())
                .setParameter("fechaHasta", fin.minusSeconds(1).atOffset(ZoneOffset.UTC).toLocalDate())
                .setParameter("grupoId", grupoId).setParameter("distritoId", distritoId)
                .getResultList().stream()
                .map(r -> new AccionesRegularizacionItemCompromisoResponse(
                        (LocalDate) r[0], (LocalDate) r[1], (String) r[2], (String) r[3], (UUID) r[4], (UUID) r[5],
                        (UUID) r[6], (String) r[7], (UUID) r[8], (String) r[9],
                        ((Enum<?>) r[10]).name(), compromisoEstadoLabel(((Enum<?>) r[10]).name()), (BigDecimal) r[11], (UUID) r[12], (String) r[13]))
                .toList();

        long regularizaciones = regs.size();
        long planesPago = planes.size();
        long compromisosPago = compromisos.size();
        long total = regularizaciones + planesPago + compromisosPago;
        double pctReg = total == 0 ? 0 : regularizaciones * 100d / total;
        double pctPlan = total == 0 ? 0 : planesPago * 100d / total;
        double pctCompromiso = total == 0 ? 0 : compromisosPago * 100d / total;

        List<AccionesRegularizacionPorTipoResponse> porTipo = total == 0 ? List.of() : List.of(
                new AccionesRegularizacionPorTipoResponse("REGULARIZACION", "Regularización", regularizaciones, pctReg),
                new AccionesRegularizacionPorTipoResponse("PLAN_DE_PAGO", "Plan de pago", planesPago, pctPlan),
                new AccionesRegularizacionPorTipoResponse("COMPROMISO_PAGO", "Compromiso de pago", compromisosPago, pctCompromiso)
        );

        AccionesRegularizacionResumenResponse resumen = new AccionesRegularizacionResumenResponse(total, regularizaciones, planesPago, compromisosPago, pctReg, pctPlan, pctCompromiso);
        return new AccionesRegularizacionResponse(
                resumen,
                porTipo,
                paginate(regs, pageable),
                paginate(planes, pageable),
                paginate(compromisos, pageable)
        );
    }

    private String compromisoEstadoLabel(String estado) {
        return switch (estado) {
            case "PENDIENTE" -> "Pendiente";
            case "CUMPLIDO" -> "Cumplido";
            case "INCUMPLIDO" -> "Incumplido";
            default -> estado;
        };
    }

    private <T> PageResponse<T> paginate(List<T> items, Pageable pageable) {
        if (items.isEmpty()) {
            return new PageResponse<>(List.of(), pageable.getPageNumber(), pageable.getPageSize(), 0, 0);
        }
        int from = Math.min((int) pageable.getOffset(), items.size());
        int to = Math.min(from + pageable.getPageSize(), items.size());
        int totalPages = pageable.getPageSize() == 0 ? 1 : (int) Math.ceil((double) items.size() / pageable.getPageSize());
        return new PageResponse<>(items.subList(from, to), pageable.getPageNumber(), pageable.getPageSize(), items.size(), totalPages);
    }
    private Map<UUID,Object[]> deudaUltimaCarga(){Optional<CargaDeuda> c=cargaDeudaRepository.findFirstByEstadoInOrderByCreatedAtDesc(List.of(CargaDeudaEstado.COMPLETADA,CargaDeudaEstado.COMPLETADA_CON_ERRORES)); if(c.isEmpty()) return Map.of(); return cargaDeudaDetalleRepository.findDeudaByCarga(c.get().getId()).stream().collect(Collectors.toMap(v->(UUID)v[0],v->v));}
}

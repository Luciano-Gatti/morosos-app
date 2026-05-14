package pe.morosos.reporte.service;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
@Slf4j
@RequiredArgsConstructor
public class ReporteService {
    private static final int CUOTAS_MIN_DEFAULT = 2;
    private static final String PARAM_CUOTAS_MIN = "CUOTAS_PARA_MOROSO";
    private static final String PARAM_CUOTAS_MIN_LEGACY = "CUOTAS_MINIMAS_MOROSIDAD";
    private static final String SIN_GRUPO = "Sin grupo";
    private static final String SIN_DISTRITO = "Sin distrito";

    private final InmuebleRepository inmuebleRepository;
    private final CargaDeudaRepository cargaDeudaRepository;
    private final CargaDeudaDetalleRepository cargaDeudaDetalleRepository;
    private final ParametroSeguimientoRepository parametroSeguimientoRepository;
    private final AuditLogRepository auditLogRepository;
    private final EntityManager entityManager;


    @Transactional(readOnly = true)
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
        try {
            log.info("[morosos-grupo-distrito] Inicio armado de reporte");
            int min = cuotasMinimas();
            log.info("[morosos-grupo-distrito] Umbral cuotas mínimas: {}", min);
            List<Inmueble> activos = inmuebleRepository.findActivosWithGrupoAndDistrito().stream()
                .filter(Objects::nonNull)
                .filter(i -> i.getId() != null)
                .toList();
            log.info("[morosos-grupo-distrito] Inmuebles activos encontrados: {}", activos.size());

            Optional<CargaDeuda> ultimaCargaValida = cargaDeudaRepository.findFirstByEstadoInOrderByCreatedAtDesc(List.of(CargaDeudaEstado.COMPLETADA, CargaDeudaEstado.COMPLETADA_CON_ERRORES));
            log.info("[morosos-grupo-distrito] Última carga válida existe: {}", ultimaCargaValida.isPresent());
            ultimaCargaValida.ifPresent(carga -> log.info("[morosos-grupo-distrito] Carga usada id={}, periodo={}, estado={}", carga.getId(), carga.getPeriodo(), carga.getEstado()));

            Map<UUID,Object[]> deuda = deudaUltimaCarga();
            int detallesEncontrados = deuda.size();
            long cuotasVencidasNull = deuda.values().stream().filter(Objects::nonNull).filter(x -> x.length > 1 && x[1] == null).count();
            long montoVencidoNull = deuda.values().stream().filter(Objects::nonNull).filter(x -> x.length > 2 && x[2] == null).count();
            log.info("[morosos-grupo-distrito] Detalles deuda encontrados: {}", detallesEncontrados);
            log.info("[morosos-grupo-distrito] Detalles con cuotas_vencidas null: {}", cuotasVencidasNull);
            log.info("[morosos-grupo-distrito] Detalles con monto_vencido null: {}", montoVencidoNull);

        Map<String, List<Inmueble>> porPar = activos.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(i -> grupoId(i) + "|" + distritoId(i)));
        Map<UUID, List<Inmueble>> porDist = activos.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(this::distritoId));

        List<MorososGrupoDistritoRowResponse> filas = new ArrayList<>();
        long totalPad = activos.size();
        long totalDeu = 0;
        long totalMor = 0;
        BigDecimal montoTotal = BigDecimal.ZERO;

        for (List<Inmueble> items : porPar.values()) {
            if (items.isEmpty()) {
                continue;
            }
            Inmueble r = items.get(0);
            UUID grupoId = grupoId(r);
            String grupoNombre = grupoNombre(r);
            UUID distritoId = distritoId(r);
            String distritoNombre = distritoNombre(r);
            long p = items.size();
            long d = 0;
            long m = 0;
            BigDecimal mt = BigDecimal.ZERO;

            for (Inmueble i : items) {
                if (i == null || i.getId() == null) {
                    continue;
                }
                Object[] x = deuda.get(i.getId());
                int cuotas = 0;
                BigDecimal monto = BigDecimal.ZERO;
                if (x != null) {
                    cuotas = asIntegerOrZero(x[1]);
                    monto = asBigDecimalOrZero(x[2]);
                    mt = mt.add(monto);
                }
                if (cuotas >= min) {
                    m++;
                } else if (cuotas > 0) {
                    d++;
                }
            }
            totalDeu += d;
            totalMor += m;
            montoTotal = montoTotal.add(mt);
            long a = p - d - m;
            filas.add(new MorososGrupoDistritoRowResponse(grupoId, grupoNombre, distritoId, distritoNombre, p, d, m, a, p == 0 ? 0 : m * 100d / p, mt));
        }

            List<MorososGrupoDistritoDistritoResponse> porDistrito = new ArrayList<>();
        for (List<Inmueble> items : porDist.values()) {
            if (items.isEmpty()) {
                continue;
            }
            Inmueble r = items.get(0);
            UUID distritoId = distritoId(r);
            String distritoNombre = distritoNombre(r);
            long p = items.size();
            long d = 0;
            long m = 0;
            BigDecimal mt = BigDecimal.ZERO;
            for (Inmueble i : items) {
                if (i == null || i.getId() == null) {
                    continue;
                }
                Object[] x = deuda.get(i.getId());
                int cuotas = 0;
                BigDecimal monto = BigDecimal.ZERO;
                if (x != null) {
                    cuotas = asIntegerOrZero(x[1]);
                    monto = asBigDecimalOrZero(x[2]);
                    mt = mt.add(monto);
                }
                if (cuotas >= min) {
                    m++;
                } else if (cuotas > 0) {
                    d++;
                }
            }
            long a = p - d - m;
            porDistrito.add(new MorososGrupoDistritoDistritoResponse(distritoId, distritoNombre, p, d, m, a, p == 0 ? 0 : m * 100d / p, mt));
        }
            long detallesDebajoUmbral = deuda.values().stream().filter(Objects::nonNull).filter(x -> asIntegerOrZero(x[1]) < min).count();
            log.info("[morosos-grupo-distrito] Detalles por debajo del umbral: {}", detallesDebajoUmbral);
            log.info("[morosos-grupo-distrito] Cantidad final de items para el reporte (filas): {}", filas.size());

            long totalAlDia = totalPad - totalDeu - totalMor;
            return new MorososGrupoDistritoResponse(
                    totalPad,
                    totalDeu,
                    totalMor,
                    totalAlDia,
                    totalPad == 0 ? 0 : totalMor * 100d / totalPad,
                    min,
                    filas,
                    aggregatePorGrupo(filas),
                    porDistrito,
                    filas
            );
        } catch (Exception e) {
            log.error("[morosos-grupo-distrito] Error armando reporte", e);
            throw e;
        }
    }
    private List<MorososGrupoDistritoRowResponse> aggregatePorGrupo(List<MorososGrupoDistritoRowResponse> filas) {
        Map<UUID, List<MorososGrupoDistritoRowResponse>> porGrupo = filas.stream()
                .collect(Collectors.groupingBy(MorososGrupoDistritoRowResponse::grupoId));
        List<MorososGrupoDistritoRowResponse> resultado = new ArrayList<>();
        for (List<MorososGrupoDistritoRowResponse> items : porGrupo.values()) {
            MorososGrupoDistritoRowResponse ref = items.get(0);
            long padron = items.stream().mapToLong(MorososGrupoDistritoRowResponse::padron).sum();
            long deudores = items.stream().mapToLong(MorososGrupoDistritoRowResponse::deudores).sum();
            long morosos = items.stream().mapToLong(MorososGrupoDistritoRowResponse::morosos).sum();
            long alDia = items.stream().mapToLong(MorososGrupoDistritoRowResponse::alDia).sum();
            BigDecimal monto = items.stream().map(MorososGrupoDistritoRowResponse::montoTotalDeuda).reduce(BigDecimal.ZERO, BigDecimal::add);
            resultado.add(new MorososGrupoDistritoRowResponse(ref.grupoId(), ref.grupoNombre(), null, "", padron, deudores, morosos, alDia, padron == 0 ? 0 : morosos * 100d / padron, monto));
        }
        return resultado;
    }

    private EstadoInmueblesResponse reporteEstadoInmuebles(){List<Inmueble> all=inmuebleRepository.findAll(); long total=all.size(),act=all.stream().filter(Inmueble::isActivo).count(),hab=all.stream().filter(Inmueble::isSeguimientoHabilitado).count();
        var porGrupo=all.stream().collect(Collectors.groupingBy(i->i.getGrupo()==null?null:i.getGrupo().getId()));
        List<EstadoInmueblesGrupoResponse> g=porGrupo.values().stream().map(v->{Inmueble r=v.get(0); long t=v.size(),a=v.stream().filter(Inmueble::isActivo).count(),h=v.stream().filter(Inmueble::isSeguimientoHabilitado).count(); return new EstadoInmueblesGrupoResponse(r.getGrupo()==null?null:r.getGrupo().getId(),r.getGrupo()==null?"Sin grupo":r.getGrupo().getNombre(),t,a,t-a,h,t-h);}).toList();
        var porDist=all.stream().collect(Collectors.groupingBy(i->i.getDistrito()==null?null:i.getDistrito().getId()));
        List<EstadoInmueblesDistritoResponse> d=porDist.values().stream().map(v->{Inmueble r=v.get(0); long t=v.size(),a=v.stream().filter(Inmueble::isActivo).count(),h=v.stream().filter(Inmueble::isSeguimientoHabilitado).count(); return new EstadoInmueblesDistritoResponse(r.getDistrito()==null?null:r.getDistrito().getId(),r.getDistrito()==null?"Sin distrito":r.getDistrito().getNombre(),t,a,t-a,h,t-h);}).toList();
        return new EstadoInmueblesResponse(total,act,total-act,hab,total-hab,g,d);}    
    private PageResponse<MovimientoReporteResponse> reporteHistorialMovimientos(LocalDate desde, LocalDate hasta,String action,String entityType,Pageable pageable){Specification<AuditLog> s=Specification.where(null); if(desde!=null){Instant i=desde.atStartOfDay().toInstant(ZoneOffset.UTC); s=s.and((r,q,c)->c.greaterThanOrEqualTo(r.get("createdAt"),i));} if(hasta!=null){Instant i=hasta.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC); s=s.and((r,q,c)->c.lessThan(r.get("createdAt"),i));} if(action!=null&&!action.isBlank()) s=s.and((r,q,c)->c.equal(r.get("action"),action)); if(entityType!=null&&!entityType.isBlank()) s=s.and((r,q,c)->c.equal(r.get("entityType"),entityType));
        Page<MovimientoReporteResponse> m=auditLogRepository.findAll(s,pageable).map(a->new MovimientoReporteResponse(a.getCreatedAt()==null?null:a.getCreatedAt().atOffset(ZoneOffset.UTC),a.getAction(),a.getEntityType(),a.getEntityId(),a.getActorId(),"%s %s".formatted(a.getEntityType(),a.getAction()),a.getOldValues(),a.getNewValues())); return PageResponse.from(m);}    
    private PorcentajesMorosidadResponse reportePorcentajesMorosidad(){int min=cuotasMinimas(); List<Inmueble> activos=inmuebleRepository.findAll().stream().filter(Inmueble::isActivo).toList(); Map<UUID,Object[]> deuda=deudaUltimaCarga(); long con=0,mor=0; BigDecimal monto=BigDecimal.ZERO; for(Inmueble i:activos){Object[] x=deuda.get(i.getId()); if(x!=null){con++; Integer c=(Integer)x[1]; BigDecimal b=(BigDecimal)x[2]; monto=monto.add(b==null?BigDecimal.ZERO:b); if(c!=null&&c>=min)mor++;}}
        List<PorcentajesMorosidadDetalleResponse> pg=buildDetalle(activos,deuda,min,true); List<PorcentajesMorosidadDetalleResponse> pd=buildDetalle(activos,deuda,min,false); long t=activos.size(); return new PorcentajesMorosidadResponse(t,con,mor,t-mor,t==0?0:con*100d/t,t==0?0:mor*100d/t,t==0?0:(t-mor)*100d/t,monto,pg,pd);}    
    private List<PorcentajesMorosidadDetalleResponse> buildDetalle(List<Inmueble> activos,Map<UUID,Object[]> deuda,int min,boolean grupo){Map<UUID,List<Inmueble>> map=activos.stream().collect(Collectors.groupingBy(i->grupo?i.getGrupo().getId():i.getDistrito().getId())); List<PorcentajesMorosidadDetalleResponse> out=new ArrayList<>(); for(List<Inmueble> v:map.values()){Inmueble r=v.get(0); long t=v.size(),c=0,m=0; BigDecimal mt=BigDecimal.ZERO; for(Inmueble i:v){Object[] x=deuda.get(i.getId()); if(x!=null){c++; Integer cc=(Integer)x[1]; BigDecimal b=(BigDecimal)x[2]; mt=mt.add(b==null?BigDecimal.ZERO:b); if(cc!=null&&cc>=min)m++;}} out.add(new PorcentajesMorosidadDetalleResponse(grupo?r.getGrupo().getId():r.getDistrito().getId(),grupo?r.getGrupo().getNombre():r.getDistrito().getNombre(),t,c,m,t-m,t==0?0:c*100d/t,t==0?0:m*100d/t,t==0?0:(t-m)*100d/t,mt));} return out;}
    private int cuotasMinimas() {
        return parametroSeguimientoRepository.findByCodigoIgnoreCase(PARAM_CUOTAS_MIN)
                .or(() -> parametroSeguimientoRepository.findByCodigoIgnoreCase(PARAM_CUOTAS_MIN_LEGACY))
                .map(p -> {
                    String valor = p.getValor();
                    if (valor == null || valor.isBlank()) {
                        return CUOTAS_MIN_DEFAULT;
                    }
                    try {
                        return Integer.parseInt(valor.trim());
                    } catch (NumberFormatException ex) {
                        return CUOTAS_MIN_DEFAULT;
                    }
                })
                .orElse(CUOTAS_MIN_DEFAULT);
    }


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
    private Map<UUID,Object[]> deudaUltimaCarga(){Optional<CargaDeuda> c=cargaDeudaRepository.findFirstByEstadoInOrderByCreatedAtDesc(List.of(CargaDeudaEstado.COMPLETADA,CargaDeudaEstado.COMPLETADA_CON_ERRORES)); if(c.isEmpty()) return Map.of(); return cargaDeudaDetalleRepository.findDeudaByCarga(c.get().getId()).stream().filter(v -> v != null && v.length > 0 && v[0] instanceof UUID).collect(Collectors.toMap(v->(UUID)v[0],v->v,(a,b)->a));}

    private UUID grupoId(Inmueble i) {
        return i == null || i.getGrupo() == null ? null : i.getGrupo().getId();
    }

    private String grupoNombre(Inmueble i) {
        if (i == null || i.getGrupo() == null || i.getGrupo().getNombre() == null || i.getGrupo().getNombre().isBlank()) {
            return SIN_GRUPO;
        }
        return i.getGrupo().getNombre();
    }

    private UUID distritoId(Inmueble i) {
        return i == null || i.getDistrito() == null ? null : i.getDistrito().getId();
    }

    private String distritoNombre(Inmueble i) {
        if (i == null || i.getDistrito() == null || i.getDistrito().getNombre() == null || i.getDistrito().getNombre().isBlank()) {
            return SIN_DISTRITO;
        }
        return i.getDistrito().getNombre();
    }

    private int asIntegerOrZero(Object value) {
        if (value == null) return 0;
        if (value instanceof Integer i) return i;
        if (value instanceof Number n) return n.intValue();
        return 0;
    }

    private BigDecimal asBigDecimalOrZero(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal b) return b;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return BigDecimal.ZERO;
    }
}

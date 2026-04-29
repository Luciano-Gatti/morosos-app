package pe.morosos.reporte.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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

    public Object obtenerReporte(String reporteId, LocalDate fechaDesde, LocalDate fechaHasta, String action,
                                 String entityType, Pageable pageable) {
        return switch (reporteId) {
            case "morosos-grupo-distrito" -> reporteMorososGrupoDistrito();
            case "estado-inmuebles" -> reporteEstadoInmuebles();
            case "historial-movimientos" -> reporteHistorialMovimientos(fechaDesde, fechaHasta, action, entityType, pageable);
            case "porcentajes-morosidad" -> reportePorcentajesMorosidad();
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
    private Map<UUID,Object[]> deudaUltimaCarga(){Optional<CargaDeuda> c=cargaDeudaRepository.findFirstByEstadoInOrderByCreatedAtDesc(List.of(CargaDeudaEstado.COMPLETADA,CargaDeudaEstado.COMPLETADA_CON_ERRORES)); if(c.isEmpty()) return Map.of(); return cargaDeudaDetalleRepository.findDeudaByCarga(c.get().getId()).stream().collect(Collectors.toMap(v->(UUID)v[0],v->v));}
}

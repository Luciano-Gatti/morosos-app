package pe.morosos.deuda.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pe.morosos.audit.service.AuditService;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.deuda.dto.CargaDeudaResponse;
import pe.morosos.deuda.entity.*;
import pe.morosos.deuda.mapper.CargaDeudaMapper;
import pe.morosos.deuda.repository.*;
import pe.morosos.importacion.parser.CsvRowParser;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.inmueble.repository.InmuebleRepository;

@Slf4j
@Service @RequiredArgsConstructor
public class ImportacionDeudaService {
 private final CargaDeudaRepository cargaRepo; private final CargaDeudaDetalleRepository detRepo; private final CargaDeudaErrorRepository errRepo; private final InmuebleRepository inmuebleRepo; private final CsvRowParser parser; private final CargaDeudaMapper mapper; private final ObjectMapper objectMapper; private final AuditService auditService;
 @Transactional
 public CargaDeudaResponse importar(LocalDate periodo, MultipartFile file){
  log.info("Iniciando importación de deuda para periodo {}", periodo);
  if(periodo.getDayOfMonth()!=1) throw new BusinessRuleException("El período debe corresponder al primer día del mes");
  CargaDeuda carga=new CargaDeuda(); carga.setPeriodo(periodo); carga.setEstado(CargaDeudaEstado.PROCESANDO); carga.setArchivoNombre(file.getOriginalFilename()); carga.setTotalRegistros(0); carga.setProcesados(0); carga.setErrores(0); carga.setMontoTotal(BigDecimal.ZERO); carga=cargaRepo.save(carga);
  auditService.log("CARGA_DEUDA", carga.getId(), "INICIO_IMPORTACION", null, null, "/api/v1/deuda/cargas", null, null);
  List<Map<String,String>> rows=parser.parse(file,List.of("cuenta","cuotas_vencidas","monto_vencido"));
  carga.setTotalRegistros(rows.size());
  Set<String> seen=new HashSet<>(); int fila=1; BigDecimal total=BigDecimal.ZERO;
  for(Map<String,String> r:rows){ fila++; String cuenta=r.getOrDefault("cuenta","").trim();
    try{
      if(cuenta.isBlank()) throw new IllegalArgumentException("Falta cuenta");
      if(!seen.add(cuenta.toLowerCase(Locale.ROOT))) throw new IllegalArgumentException("Cuenta duplicada en archivo");
      int cuotas=Integer.parseInt(r.getOrDefault("cuotas_vencidas","")); if(cuotas<0) throw new IllegalArgumentException("cuotas_vencidas negativa");
      BigDecimal monto=new BigDecimal(r.getOrDefault("monto_vencido","")); if(monto.compareTo(BigDecimal.ZERO)<0) throw new IllegalArgumentException("monto_vencido negativo");
      Inmueble in=inmuebleRepo.findByCuentaIgnoreCase(cuenta).orElseThrow(()->new IllegalArgumentException("Cuenta no existe"));
      CargaDeudaDetalle d=new CargaDeudaDetalle(); d.setCargaDeuda(carga); d.setInmueble(in); d.setCuotasVencidas(cuotas); d.setMontoVencido(monto); detRepo.save(d);
      carga.setProcesados(carga.getProcesados()+1); total=total.add(monto);
    }catch(Exception ex){
      log.warn("Error de validación en fila {} de importación deuda: {}", fila, ex.getMessage());
      CargaDeudaError e=new CargaDeudaError(); e.setCargaDeuda(carga); e.setFila(fila); e.setCuenta(cuenta.isBlank()?null:cuenta); e.setMotivo(ex.getMessage()); e.setPayload(objectMapper.valueToTree(r)); errRepo.save(e); carga.setErrores(carga.getErrores()+1);
    }
  }
  carga.setMontoTotal(total);
  carga.setEstado(carga.getProcesados()==0?CargaDeudaEstado.FALLIDA:(carga.getErrores()>0?CargaDeudaEstado.COMPLETADA_CON_ERRORES:CargaDeudaEstado.COMPLETADA));
  carga=cargaRepo.save(carga);
  auditService.log("CARGA_DEUDA", carga.getId(), "FIN_IMPORTACION", null, null, "/api/v1/deuda/cargas", null, objectMapper.valueToTree(Map.of("procesados",carga.getProcesados(),"errores",carga.getErrores(),"estado",carga.getEstado().name())));
  log.info("Finalizó importación deuda {} con estado {}, procesados {}, errores {}", carga.getId(), carga.getEstado(), carga.getProcesados(), carga.getErrores());
  return mapper.toResponse(carga);
 }
}

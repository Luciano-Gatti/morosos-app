package pe.morosos.importacion.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pe.morosos.audit.service.AuditService;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.distrito.entity.Distrito;
import pe.morosos.distrito.repository.DistritoRepository;
import pe.morosos.grupo.entity.Grupo;
import pe.morosos.grupo.repository.GrupoRepository;
import pe.morosos.grupodistrito.repository.GrupoDistritoConfigRepository;
import pe.morosos.importacion.dto.*;
import pe.morosos.importacion.entity.*;
import pe.morosos.importacion.mapper.ImportacionInmuebleMapper;
import pe.morosos.importacion.parser.CsvRowParser;
import pe.morosos.importacion.repository.*;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.inmueble.repository.InmuebleRepository;

@Service @RequiredArgsConstructor
public class ImportacionInmuebleService {
 private final ImportacionInmuebleRepository repo; private final ImportacionInmuebleErrorRepository errRepo; private final InmuebleRepository inmuebleRepo; private final GrupoRepository grupoRepo; private final DistritoRepository distritoRepo; private final GrupoDistritoConfigRepository gdcRepo; private final CsvRowParser parser; private final ImportacionInmuebleMapper mapper; private final ObjectMapper objectMapper; private final AuditService auditService;

 @Transactional
 public ImportacionInmuebleResponse importar(MultipartFile file){
  ImportacionInmueble imp=new ImportacionInmueble(); imp.setArchivoNombre(file.getOriginalFilename()); imp.setEstado(ImportacionEstado.PROCESANDO); imp.setTotalRegistros(0); imp.setProcesados(0); imp.setCreados(0); imp.setActualizados(0); imp.setErrores(0); imp=repo.save(imp);
  auditService.log("IMPORTACION_INMUEBLE", imp.getId(), "INICIO_IMPORTACION", null, null, "/api/v1/inmuebles/importaciones", null, null);
  List<Map<String,String>> rows=parser.parse(file,List.of("cuenta","titular","direccion","grupo","distrito"));
  imp.setTotalRegistros(rows.size());
  int fila=1;
  for(Map<String,String> r: rows){ fila++; String cuenta=r.getOrDefault("cuenta","");
    try{
      if(cuenta.isBlank()||r.getOrDefault("titular","").isBlank()||r.getOrDefault("direccion","").isBlank()) throw new IllegalArgumentException("Faltan campos obligatorios");
      Grupo g=grupoRepo.findByCodigoIgnoreCase(r.getOrDefault("grupo","")).orElseThrow(()->new IllegalArgumentException("Grupo no existe"));
      Distrito d=distritoRepo.findByCodigoIgnoreCase(r.getOrDefault("distrito","")).orElseThrow(()->new IllegalArgumentException("Distrito no existe"));
      if(!gdcRepo.existsByGrupoIdAndDistritoId(g.getId(),d.getId())) throw new IllegalArgumentException("No existe grupo_distrito_config");
      Optional<Inmueble> opt=inmuebleRepo.findByCuentaIgnoreCase(cuenta);
      Inmueble in=opt.orElseGet(Inmueble::new);
      boolean created=opt.isEmpty();
      in.setCuenta(cuenta); in.setTitular(r.get("titular")); in.setDireccion(r.get("direccion")); in.setGrupo(g); in.setDistrito(d);
      if(r.containsKey("seguimiento_habilitado")&&!r.get("seguimiento_habilitado").isBlank()) in.setSeguimientoHabilitado(Boolean.parseBoolean(r.get("seguimiento_habilitado")));
      else if(created) in.setSeguimientoHabilitado(true);
      in.setObservacion(r.get("observacion"));
      inmuebleRepo.save(in); imp.setProcesados(imp.getProcesados()+1); if(created) imp.setCreados(imp.getCreados()+1); else imp.setActualizados(imp.getActualizados()+1);
    }catch(Exception ex){
      ImportacionInmuebleError e=new ImportacionInmuebleError(); e.setImportacion(imp); e.setFila(fila); e.setCuenta(cuenta.isBlank()?null:cuenta); e.setMotivo(ex.getMessage()); e.setPayload(objectMapper.valueToTree(r)); errRepo.save(e); imp.setErrores(imp.getErrores()+1);
    }
  }
  imp.setEstado(imp.getProcesados()==0?ImportacionEstado.FALLIDA:(imp.getErrores()>0?ImportacionEstado.COMPLETADA_CON_ERRORES:ImportacionEstado.COMPLETADA));
  imp=repo.save(imp);
  auditService.log("IMPORTACION_INMUEBLE", imp.getId(), "FIN_IMPORTACION", null, null, "/api/v1/inmuebles/importaciones", null, objectMapper.valueToTree(Map.of("procesados",imp.getProcesados(),"errores",imp.getErrores(),"estado",imp.getEstado().name())));
  return mapper.toResponse(imp);
 }
 @Transactional(readOnly=true) public ImportacionInmuebleResponse get(UUID id){return mapper.toResponse(repo.findById(id).orElseThrow(()->new ResourceNotFoundException("Importación no encontrada")));}
 @Transactional(readOnly=true) public Page<ImportacionInmuebleErrorResponse> errores(UUID id, Pageable p){if(!repo.existsById(id)) throw new ResourceNotFoundException("Importación no encontrada"); return errRepo.findByImportacionId(id,p).map(mapper::toErrorResponse);} 
}

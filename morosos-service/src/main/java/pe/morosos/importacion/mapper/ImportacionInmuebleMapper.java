package pe.morosos.importacion.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.importacion.dto.ImportacionInmuebleErrorResponse;
import pe.morosos.importacion.dto.ImportacionInmuebleResponse;
import pe.morosos.importacion.entity.ImportacionInmueble;
import pe.morosos.importacion.entity.ImportacionInmuebleError;

@Component
public class ImportacionInmuebleMapper {
 public ImportacionInmuebleResponse toResponse(ImportacionInmueble i){return new ImportacionInmuebleResponse(i.getId(),i.getArchivoNombre(),i.getTotalRegistros(),i.getProcesados(),i.getCreados(),i.getActualizados(),i.getErrores(),i.getEstado(),i.getCreatedBy(),i.getCreatedAt(),i.getUpdatedBy(),i.getUpdatedAt());}
 public ImportacionInmuebleErrorResponse toErrorResponse(ImportacionInmuebleError e){return new ImportacionInmuebleErrorResponse(e.getId(),e.getImportacion().getId(),e.getFila(),e.getCuenta(),e.getMotivo(),e.getPayload(),e.getCreatedBy(),e.getCreatedAt());}
}

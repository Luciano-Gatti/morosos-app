package pe.morosos.distrito.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.distrito.dto.DistritoRequest;
import pe.morosos.distrito.dto.DistritoResponse;
import pe.morosos.distrito.entity.Distrito;

@Component
public class DistritoMapper {

    public Distrito toEntity(DistritoRequest request) {
        Distrito distrito = new Distrito();
        distrito.setCodigo(request.codigo().trim());
        distrito.setNombre(request.nombre().trim());
        distrito.setActivo(true);
        return distrito;
    }

    public void update(Distrito entity, DistritoRequest request) {
        entity.setCodigo(request.codigo().trim());
        entity.setNombre(request.nombre().trim());
    }

    public DistritoResponse toResponse(Distrito entity) {
        return new DistritoResponse(
                entity.getId(),
                entity.getCodigo(),
                entity.getNombre(),
                entity.isActivo(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt()
        );
    }
}

package pe.morosos.motivocierre.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.motivocierre.dto.MotivoCierreRequest;
import pe.morosos.motivocierre.dto.MotivoCierreResponse;
import pe.morosos.motivocierre.entity.MotivoCierre;

@Component
public class MotivoCierreMapper {

    public MotivoCierre toEntity(MotivoCierreRequest request) {
        MotivoCierre motivo = new MotivoCierre();
        motivo.setCodigo(request.codigo().trim());
        motivo.setNombre(request.nombre().trim());
        motivo.setSystem(false);
        motivo.setActivo(true);
        return motivo;
    }

    public void update(MotivoCierre entity, MotivoCierreRequest request) {
        entity.setCodigo(request.codigo().trim());
        entity.setNombre(request.nombre().trim());
    }

    public MotivoCierreResponse toResponse(MotivoCierre entity) {
        return new MotivoCierreResponse(
                entity.getId(),
                entity.getCodigo(),
                entity.getNombre(),
                entity.isSystem(),
                entity.isActivo(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt()
        );
    }
}

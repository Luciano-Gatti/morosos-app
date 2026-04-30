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
        motivo.setDescripcion(trimToNull(request.descripcion()));
        motivo.setSystem(false);
        motivo.setActivo(true);
        return motivo;
    }

    public void update(MotivoCierre entity, MotivoCierreRequest request) {
        entity.setCodigo(request.codigo().trim());
        entity.setNombre(request.nombre().trim());
        entity.setDescripcion(trimToNull(request.descripcion()));
    }

    public MotivoCierreResponse toResponse(MotivoCierre entity) {
        return toResponse(entity, 0L);
    }

    public MotivoCierreResponse toResponse(MotivoCierre entity, long usos) {
        return new MotivoCierreResponse(
                entity.getId(),
                entity.getCodigo(),
                entity.getNombre(),
                entity.getDescripcion(),
                usos,
                entity.isSystem(),
                entity.isActivo(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt()
        );
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

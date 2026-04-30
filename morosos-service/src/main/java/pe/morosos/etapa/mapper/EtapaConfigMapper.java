package pe.morosos.etapa.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.etapa.dto.EtapaConfigRequest;
import pe.morosos.etapa.dto.EtapaConfigResponse;
import pe.morosos.etapa.entity.EtapaConfig;

@Component
public class EtapaConfigMapper {

    public EtapaConfig toEntity(EtapaConfigRequest request) {
        EtapaConfig entity = new EtapaConfig();
        update(entity, request);
        return entity;
    }

    public void update(EtapaConfig entity, EtapaConfigRequest request) {
        entity.setCodigo(request.codigo().trim());
        entity.setNombre(request.nombre().trim());
        entity.setDescripcion(trimToNull(request.descripcion()));
        entity.setOrden(request.orden());
        entity.setActivo(request.activo());
        entity.setEsFinal(request.esFinal());
    }

    public EtapaConfigResponse toResponse(EtapaConfig entity) {
        return toResponse(entity, 0L);
    }

    public EtapaConfigResponse toResponse(EtapaConfig entity, long procesosAsociados) {
        return new EtapaConfigResponse(
                entity.getId(),
                entity.getCodigo(),
                entity.getNombre(),
                entity.getDescripcion(),
                entity.getOrden(),
                entity.isActivo(),
                entity.isEsFinal(),
                procesosAsociados,
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

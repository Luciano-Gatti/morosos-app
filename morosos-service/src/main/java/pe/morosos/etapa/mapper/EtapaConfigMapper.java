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
        entity.setOrden(request.orden());
        entity.setActivo(request.activo());
        entity.setEsFinal(request.esFinal());
    }

    public EtapaConfigResponse toResponse(EtapaConfig entity) {
        return new EtapaConfigResponse(
                entity.getId(),
                entity.getCodigo(),
                entity.getNombre(),
                entity.getOrden(),
                entity.isActivo(),
                entity.isEsFinal(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt()
        );
    }
}

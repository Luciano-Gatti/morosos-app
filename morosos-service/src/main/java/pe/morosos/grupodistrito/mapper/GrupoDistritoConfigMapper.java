package pe.morosos.grupodistrito.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.distrito.entity.Distrito;
import pe.morosos.grupo.entity.Grupo;
import pe.morosos.grupodistrito.dto.GrupoDistritoConfigRequest;
import pe.morosos.grupodistrito.dto.GrupoDistritoConfigResponse;
import pe.morosos.grupodistrito.entity.GrupoDistritoConfig;

@Component
public class GrupoDistritoConfigMapper {

    public GrupoDistritoConfig toEntity(GrupoDistritoConfigRequest request, Grupo grupo, Distrito distrito) {
        GrupoDistritoConfig config = new GrupoDistritoConfig();
        config.setGrupo(grupo);
        config.setDistrito(distrito);
        config.setSeguimientoHabilitado(Boolean.TRUE.equals(request.seguimientoHabilitado()));
        return config;
    }

    public void update(GrupoDistritoConfig entity, GrupoDistritoConfigRequest request, Grupo grupo, Distrito distrito) {
        entity.setGrupo(grupo);
        entity.setDistrito(distrito);
        if (request.seguimientoHabilitado() != null) {
            entity.setSeguimientoHabilitado(request.seguimientoHabilitado());
        }
    }

    public GrupoDistritoConfigResponse toResponse(GrupoDistritoConfig entity) {
        return new GrupoDistritoConfigResponse(
                entity.getId(),
                entity.getGrupo().getId(),
                entity.getGrupo().getCodigo(),
                entity.getGrupo().getNombre(),
                entity.getDistrito().getId(),
                entity.getDistrito().getCodigo(),
                entity.getDistrito().getNombre(),
                entity.isSeguimientoHabilitado(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt()
        );
    }
}

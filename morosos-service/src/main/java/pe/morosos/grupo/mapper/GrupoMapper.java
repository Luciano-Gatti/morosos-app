package pe.morosos.grupo.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.grupo.dto.GrupoRequest;
import pe.morosos.grupo.dto.GrupoResponse;
import pe.morosos.grupo.entity.Grupo;

@Component
public class GrupoMapper {

    public Grupo toEntity(GrupoRequest request) {
        Grupo grupo = new Grupo();
        grupo.setCodigo(request.codigo().trim());
        grupo.setNombre(request.nombre().trim());
        grupo.setActivo(true);
        return grupo;
    }

    public void update(Grupo entity, GrupoRequest request) {
        entity.setCodigo(request.codigo().trim());
        entity.setNombre(request.nombre().trim());
    }

    public GrupoResponse toResponse(Grupo entity) {
        return new GrupoResponse(
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

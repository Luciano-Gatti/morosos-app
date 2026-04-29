package pe.morosos.parametro.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.parametro.dto.ParametroSeguimientoRequest;
import pe.morosos.parametro.dto.ParametroSeguimientoResponse;
import pe.morosos.parametro.entity.ParametroSeguimiento;

@Component
public class ParametroSeguimientoMapper {

    public void update(ParametroSeguimiento entity, ParametroSeguimientoRequest request) {
        entity.setValor(request.valor().trim());
        entity.setDescripcion(request.descripcion() == null ? null : request.descripcion().trim());
    }

    public ParametroSeguimientoResponse toResponse(ParametroSeguimiento entity) {
        return new ParametroSeguimientoResponse(
                entity.getId(),
                entity.getCodigo(),
                entity.getValor(),
                entity.getDescripcion(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt()
        );
    }
}

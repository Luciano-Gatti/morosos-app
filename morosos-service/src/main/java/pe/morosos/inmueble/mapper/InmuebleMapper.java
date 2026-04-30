package pe.morosos.inmueble.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.distrito.entity.Distrito;
import pe.morosos.grupo.entity.Grupo;
import pe.morosos.inmueble.dto.InmuebleResponse;
import pe.morosos.inmueble.dto.InmuebleUpdateRequest;
import pe.morosos.inmueble.entity.Inmueble;

@Component
public class InmuebleMapper {

    public void update(Inmueble entity, InmuebleUpdateRequest request, Grupo grupo, Distrito distrito) {
        entity.setCuenta(request.cuenta().trim());
        entity.setTitular(request.titular().trim());
        entity.setDireccion(request.direccion().trim());
        entity.setGrupo(grupo);
        entity.setDistrito(distrito);
        entity.setActivo(request.activo());
        entity.setSeguimientoHabilitado(request.seguimientoHabilitado());
        entity.setTelefono(trimToNull(request.telefono()));
        entity.setEmail(trimToNull(request.email()));
        entity.setObservacion(trimToNull(request.observacion()));
    }

    public InmuebleResponse toResponse(Inmueble entity) {
        return new InmuebleResponse(
                entity.getId(),
                entity.getCuenta(),
                entity.getTitular(),
                entity.getDireccion(),
                entity.getGrupo().getId(),
                entity.getGrupo().getCodigo(),
                entity.getGrupo().getNombre(),
                entity.getDistrito().getId(),
                entity.getDistrito().getCodigo(),
                entity.getDistrito().getNombre(),
                entity.isActivo(),
                entity.isSeguimientoHabilitado(),
                entity.getTelefono(),
                entity.getEmail(),
                entity.getObservacion(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt()
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

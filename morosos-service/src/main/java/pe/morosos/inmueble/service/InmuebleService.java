package pe.morosos.inmueble.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.distrito.entity.Distrito;
import pe.morosos.audit.service.AuditService;
import pe.morosos.distrito.repository.DistritoRepository;
import pe.morosos.grupo.entity.Grupo;
import pe.morosos.grupo.repository.GrupoRepository;
import pe.morosos.grupodistrito.entity.GrupoDistritoConfig;
import pe.morosos.inmueble.dto.InmuebleFilterRequest;
import pe.morosos.inmueble.dto.InmuebleResponse;
import pe.morosos.inmueble.dto.InmuebleUpdateRequest;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.inmueble.mapper.InmuebleMapper;
import pe.morosos.inmueble.repository.GrupoDistritoConfigLookupRepository;
import pe.morosos.inmueble.repository.InmuebleRepository;
import pe.morosos.inmueble.repository.InmuebleSpecifications;

@Service
@RequiredArgsConstructor
public class InmuebleService {

    private final InmuebleRepository inmuebleRepository;
    private final GrupoRepository grupoRepository;
    private final DistritoRepository distritoRepository;
    private final GrupoDistritoConfigLookupRepository grupoDistritoConfigRepository;
    private final InmuebleMapper inmuebleMapper;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<InmuebleResponse> findAll(InmuebleFilterRequest filter, Pageable pageable) {
        Specification<Inmueble> spec = Specification
                .where(InmuebleSpecifications.cuentaLike(filter.cuenta()))
                .and(InmuebleSpecifications.titularLike(filter.titular()))
                .and(InmuebleSpecifications.grupoEquals(filter.grupoId()))
                .and(InmuebleSpecifications.distritoEquals(filter.distritoId()))
                .and(InmuebleSpecifications.activoEquals(filter.activo()));

        return inmuebleRepository.findAll(spec, pageable).map(inmuebleMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public InmuebleResponse findById(UUID id) {
        return inmuebleMapper.toResponse(findEntity(id));
    }

    @Transactional
    public InmuebleResponse update(UUID id, InmuebleUpdateRequest request) {
        Inmueble inmueble = findEntity(id);

        UUID distritoIdObjetivo = request.distritoId() != null ? request.distritoId() : inmueble.getDistrito().getId();
        UUID grupoIdObjetivo = request.grupoId() != null ? request.grupoId() : inmueble.getGrupo().getId();

        Grupo grupo = grupoRepository.findById(grupoIdObjetivo)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado"));
        Distrito distrito = distritoRepository.findById(distritoIdObjetivo)
                .orElseThrow(() -> new ResourceNotFoundException("Distrito no encontrado"));

        if (!grupo.isActivo()) {
            throw new BusinessRuleException("No se puede asignar un grupo inactivo");
        }
        if (!distrito.isActivo()) {
            throw new BusinessRuleException("No se puede asignar un distrito inactivo");
        }

        grupoDistritoConfigRepository
                .findByGrupoIdAndDistritoId(grupoIdObjetivo, distritoIdObjetivo)
                .orElseThrow(() -> new BusinessRuleException(
                        "El grupo seleccionado no está asociado al distrito seleccionado."));

        UUID grupoAnteriorId = inmueble.getGrupo().getId();
        String grupoAnteriorNombre = inmueble.getGrupo().getNombre();
        UUID distritoAnteriorId = inmueble.getDistrito().getId();
        String distritoAnteriorNombre = inmueble.getDistrito().getNombre();

        inmuebleMapper.update(inmueble, request, grupo, distrito);
        Inmueble updated = inmuebleRepository.save(inmueble);

        if (!grupoAnteriorId.equals(updated.getGrupo().getId()) || !distritoAnteriorId.equals(updated.getDistrito().getId())) {
            ObjectNode oldValues = objectMapper.createObjectNode()
                    .put("grupoId", grupoAnteriorId.toString())
                    .put("grupoNombre", grupoAnteriorNombre)
                    .put("distritoId", distritoAnteriorId.toString())
                    .put("distritoNombre", distritoAnteriorNombre);
            ObjectNode newValues = objectMapper.createObjectNode()
                    .put("grupoId", updated.getGrupo().getId().toString())
                    .put("grupoNombre", updated.getGrupo().getNombre())
                    .put("distritoId", updated.getDistrito().getId().toString())
                    .put("distritoNombre", updated.getDistrito().getNombre());
            auditService.log("INMUEBLE", updated.getId(), "INMUEBLE_GRUPO_DISTRITO_ACTUALIZADO", null, null,
                    "/api/v1/inmuebles/" + id, oldValues, newValues);
        }

        return inmuebleMapper.toResponse(updated);
    }

    @Transactional
    public InmuebleResponse updateActivo(UUID id, boolean activo) {
        Inmueble inmueble = findEntity(id);
        inmueble.setActivo(activo);
        return inmuebleMapper.toResponse(inmuebleRepository.save(inmueble));
    }

    @Transactional
    public InmuebleResponse updateSeguimientoHabilitado(UUID id, boolean seguimientoHabilitado) {
        Inmueble inmueble = findEntity(id);

        GrupoDistritoConfig config = grupoDistritoConfigRepository
                .findByGrupoIdAndDistritoId(inmueble.getGrupo().getId(), inmueble.getDistrito().getId())
                .orElseThrow(() -> new BusinessRuleException(
                        "No existe configuración para la combinación grupo-distrito del inmueble"));

        validateSeguimientoConsistency(config.isSeguimientoHabilitado(), seguimientoHabilitado);

        inmueble.setSeguimientoHabilitado(seguimientoHabilitado);
        return inmuebleMapper.toResponse(inmuebleRepository.save(inmueble));
    }

    private Inmueble findEntity(UUID id) {
        return inmuebleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inmueble no encontrado"));
    }

    private void validateSeguimientoConsistency(boolean reglaGeneral, boolean overrideInmueble) {
        if (!reglaGeneral && overrideInmueble) {
            throw new BusinessRuleException(
                    "Inconsistencia: no se puede habilitar seguimiento en inmueble cuando la regla general está deshabilitada"
            );
        }
    }
}

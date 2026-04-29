package pe.morosos.inmueble.service;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.common.exception.ConflictException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.distrito.entity.Distrito;
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

        if (inmuebleRepository.existsByCuentaIgnoreCaseAndIdNot(request.cuenta().trim(), id)) {
            throw new ConflictException("Ya existe un inmueble con la misma cuenta");
        }

        Grupo grupo = grupoRepository.findById(request.grupoId())
                .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado"));
        Distrito distrito = distritoRepository.findById(request.distritoId())
                .orElseThrow(() -> new ResourceNotFoundException("Distrito no encontrado"));

        GrupoDistritoConfig config = grupoDistritoConfigRepository
                .findByGrupoIdAndDistritoId(request.grupoId(), request.distritoId())
                .orElseThrow(() -> new BusinessRuleException(
                        "No existe configuración para la combinación grupo-distrito"));

        validateSeguimientoConsistency(config.isSeguimientoHabilitado(), request.seguimientoHabilitado());

        inmuebleMapper.update(inmueble, request, grupo, distrito);
        return inmuebleMapper.toResponse(inmuebleRepository.save(inmueble));
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

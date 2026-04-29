package pe.morosos.motivocierre.service;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.common.exception.ConflictException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.common.util.UsageValidationService;
import pe.morosos.motivocierre.dto.MotivoCierreRequest;
import pe.morosos.motivocierre.dto.MotivoCierreResponse;
import pe.morosos.motivocierre.entity.MotivoCierre;
import pe.morosos.motivocierre.mapper.MotivoCierreMapper;
import pe.morosos.motivocierre.repository.MotivoCierreRepository;

@Service
@RequiredArgsConstructor
public class MotivoCierreService {

    private final MotivoCierreRepository repository;
    private final MotivoCierreMapper mapper;
    private final UsageValidationService usageValidationService;

    @Transactional(readOnly = true)
    public List<MotivoCierreResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public MotivoCierreResponse create(MotivoCierreRequest request) {
        validateUniqueness(request, null);
        MotivoCierre created = repository.save(mapper.toEntity(request));
        return mapper.toResponse(created);
    }

    @Transactional
    public MotivoCierreResponse update(UUID id, MotivoCierreRequest request) {
        MotivoCierre entity = findEntity(id);
        if (entity.isSystem()) {
            throw new BusinessRuleException("Los motivos de sistema no son editables");
        }
        validateUniqueness(request, id);
        mapper.update(entity, request);
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public MotivoCierreResponse updateActivo(UUID id, boolean activo) {
        MotivoCierre entity = findEntity(id);
        entity.setActivo(activo);
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        MotivoCierre entity = findEntity(id);
        if (entity.isSystem()) {
            throw new BusinessRuleException("Los motivos de sistema no se pueden eliminar");
        }

        if (usageValidationService.hasRelatedRows("proceso_cierre", "motivo_cierre_id", id)) {
            throw new BusinessRuleException("No se puede eliminar un motivo con uso; desactívelo");
        }

        repository.delete(entity);
    }

    private MotivoCierre findEntity(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Motivo de cierre no encontrado"));
    }

    private void validateUniqueness(MotivoCierreRequest request, UUID id) {
        boolean codigoDuplicado = id == null
                ? repository.existsByCodigoIgnoreCase(request.codigo().trim())
                : repository.existsByCodigoIgnoreCaseAndIdNot(request.codigo().trim(), id);
        if (codigoDuplicado) {
            throw new ConflictException("Ya existe un motivo de cierre con el mismo código");
        }

        boolean nombreDuplicado = id == null
                ? repository.existsByNombreIgnoreCase(request.nombre().trim())
                : repository.existsByNombreIgnoreCaseAndIdNot(request.nombre().trim(), id);
        if (nombreDuplicado) {
            throw new ConflictException("Ya existe un motivo de cierre con el mismo nombre");
        }
    }
}

package pe.morosos.grupo.service;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.common.exception.ConflictException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.common.util.UsageValidationService;
import pe.morosos.grupo.dto.GrupoRequest;
import pe.morosos.grupo.dto.GrupoResponse;
import pe.morosos.grupo.entity.Grupo;
import pe.morosos.grupo.mapper.GrupoMapper;
import pe.morosos.grupo.repository.GrupoRepository;

@Service
@RequiredArgsConstructor
public class GrupoService {

    private final GrupoRepository grupoRepository;
    private final GrupoMapper grupoMapper;
    private final UsageValidationService usageValidationService;

    @Transactional(readOnly = true)
    public List<GrupoResponse> findAll() {
        return grupoRepository.findAll().stream().map(grupoMapper::toResponse).toList();
    }

    @Transactional
    public GrupoResponse create(GrupoRequest request) {
        validateUniqueness(request, null);
        Grupo created = grupoRepository.save(grupoMapper.toEntity(request));
        return grupoMapper.toResponse(created);
    }

    @Transactional
    public GrupoResponse update(UUID id, GrupoRequest request) {
        Grupo grupo = findEntity(id);
        validateUniqueness(request, id);
        grupoMapper.update(grupo, request);
        return grupoMapper.toResponse(grupoRepository.save(grupo));
    }

    @Transactional
    public void delete(UUID id) {
        Grupo grupo = findEntity(id);
        if (usageValidationService.hasRelatedRows("inmueble", "grupo_id", id)) {
            throw new BusinessRuleException("No se puede eliminar un grupo con inmuebles asociados");
        }
        grupoRepository.delete(grupo);
    }

    @Transactional
    public GrupoResponse updateActivo(UUID id, boolean activo) {
        Grupo grupo = findEntity(id);
        grupo.setActivo(activo);
        return grupoMapper.toResponse(grupoRepository.save(grupo));
    }

    private Grupo findEntity(UUID id) {
        return grupoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado"));
    }

    private void validateUniqueness(GrupoRequest request, UUID id) {
        boolean codigoDuplicado = id == null
                ? grupoRepository.existsByCodigoIgnoreCase(request.codigo().trim())
                : grupoRepository.existsByCodigoIgnoreCaseAndIdNot(request.codigo().trim(), id);

        if (codigoDuplicado) {
            throw new ConflictException("Ya existe un grupo con el mismo código");
        }

        boolean nombreDuplicado = id == null
                ? grupoRepository.existsByNombreIgnoreCase(request.nombre().trim())
                : grupoRepository.existsByNombreIgnoreCaseAndIdNot(request.nombre().trim(), id);

        if (nombreDuplicado) {
            throw new ConflictException("Ya existe un grupo con el mismo nombre");
        }
    }
}

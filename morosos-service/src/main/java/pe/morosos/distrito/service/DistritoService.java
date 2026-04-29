package pe.morosos.distrito.service;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.common.exception.ConflictException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.distrito.dto.DistritoRequest;
import pe.morosos.distrito.dto.DistritoResponse;
import pe.morosos.distrito.entity.Distrito;
import pe.morosos.distrito.mapper.DistritoMapper;
import pe.morosos.distrito.repository.DistritoRepository;

@Service
@RequiredArgsConstructor
public class DistritoService {

    private final DistritoRepository distritoRepository;
    private final DistritoMapper distritoMapper;

    @Transactional(readOnly = true)
    public List<DistritoResponse> findAll() {
        return distritoRepository.findAll().stream().map(distritoMapper::toResponse).toList();
    }

    @Transactional
    public DistritoResponse create(DistritoRequest request) {
        validateUniqueness(request, null);
        Distrito created = distritoRepository.save(distritoMapper.toEntity(request));
        return distritoMapper.toResponse(created);
    }

    @Transactional
    public DistritoResponse update(UUID id, DistritoRequest request) {
        Distrito distrito = findEntity(id);
        validateUniqueness(request, id);
        distritoMapper.update(distrito, request);
        return distritoMapper.toResponse(distritoRepository.save(distrito));
    }

    @Transactional
    public DistritoResponse updateActivo(UUID id, boolean activo) {
        Distrito distrito = findEntity(id);
        distrito.setActivo(activo);
        return distritoMapper.toResponse(distritoRepository.save(distrito));
    }

    private Distrito findEntity(UUID id) {
        return distritoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Distrito no encontrado"));
    }

    private void validateUniqueness(DistritoRequest request, UUID id) {
        boolean codigoDuplicado = id == null
                ? distritoRepository.existsByCodigoIgnoreCase(request.codigo().trim())
                : distritoRepository.existsByCodigoIgnoreCaseAndIdNot(request.codigo().trim(), id);

        if (codigoDuplicado) {
            throw new ConflictException("Ya existe un distrito con el mismo código");
        }

        boolean nombreDuplicado = id == null
                ? distritoRepository.existsByNombreIgnoreCase(request.nombre().trim())
                : distritoRepository.existsByNombreIgnoreCaseAndIdNot(request.nombre().trim(), id);

        if (nombreDuplicado) {
            throw new ConflictException("Ya existe un distrito con el mismo nombre");
        }
    }
}

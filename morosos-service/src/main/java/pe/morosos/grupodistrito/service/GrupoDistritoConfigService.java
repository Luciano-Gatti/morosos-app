package pe.morosos.grupodistrito.service;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.common.exception.ConflictException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.distrito.entity.Distrito;
import pe.morosos.distrito.repository.DistritoRepository;
import pe.morosos.grupo.entity.Grupo;
import pe.morosos.grupo.repository.GrupoRepository;
import pe.morosos.grupodistrito.dto.GrupoDistritoConfigRequest;
import pe.morosos.grupodistrito.dto.GrupoDistritoConfigResponse;
import pe.morosos.grupodistrito.entity.GrupoDistritoConfig;
import pe.morosos.grupodistrito.mapper.GrupoDistritoConfigMapper;
import pe.morosos.grupodistrito.repository.GrupoDistritoConfigRepository;

@Service
@RequiredArgsConstructor
public class GrupoDistritoConfigService {

    private final GrupoDistritoConfigRepository repository;
    private final GrupoRepository grupoRepository;
    private final DistritoRepository distritoRepository;
    private final GrupoDistritoConfigMapper mapper;

    @Transactional(readOnly = true)
    public List<GrupoDistritoConfigResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public GrupoDistritoConfigResponse update(UUID id, GrupoDistritoConfigRequest request) {
        GrupoDistritoConfig config = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración grupo-distrito no encontrada"));

        if (repository.existsByGrupoIdAndDistritoIdAndIdNot(request.grupoId(), request.distritoId(), id)) {
            throw new ConflictException("Ya existe una configuración para el grupo y distrito seleccionados");
        }

        Grupo grupo = grupoRepository.findById(request.grupoId())
                .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado"));

        Distrito distrito = distritoRepository.findById(request.distritoId())
                .orElseThrow(() -> new ResourceNotFoundException("Distrito no encontrado"));

        mapper.update(config, request, grupo, distrito);
        return mapper.toResponse(repository.save(config));
    }
}

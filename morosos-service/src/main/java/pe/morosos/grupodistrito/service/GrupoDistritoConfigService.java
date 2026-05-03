package pe.morosos.grupodistrito.service;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.audit.service.AuditService;
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
import pe.morosos.inmueble.repository.InmuebleRepository;

@Service
@RequiredArgsConstructor
public class GrupoDistritoConfigService {

    private final GrupoDistritoConfigRepository repository;
    private final GrupoRepository grupoRepository;
    private final DistritoRepository distritoRepository;
    private final GrupoDistritoConfigMapper mapper;
    private final InmuebleRepository inmuebleRepository;
    private final AuditService auditService;

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

        validateActivos(grupo, distrito);
        boolean prevSeguimiento = config.isSeguimientoHabilitado();
        mapper.update(config, request, grupo, distrito);
        GrupoDistritoConfig saved = repository.save(config);
        if (prevSeguimiento != saved.isSeguimientoHabilitado()) {
            auditService.log("GRUPO_DISTRITO_CONFIG", saved.getId(), "GRUPO_DISTRITO_SEGUIMIENTO_ACTUALIZADO", null, null);
        }
        return mapper.toResponse(saved);
    }

    @Transactional
    public GrupoDistritoConfigResponse create(GrupoDistritoConfigRequest request) {
        if (repository.existsByGrupoIdAndDistritoId(request.grupoId(), request.distritoId())) {
            throw new ConflictException("El distrito ya está asociado al grupo.");
        }
        Grupo grupo = grupoRepository.findById(request.grupoId())
                .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado"));
        Distrito distrito = distritoRepository.findById(request.distritoId())
                .orElseThrow(() -> new ResourceNotFoundException("Distrito no encontrado"));
        validateActivos(grupo, distrito);
        GrupoDistritoConfig entity = mapper.toEntity(request, grupo, distrito);
        if (request.seguimientoHabilitado() == null) {
            entity.setSeguimientoHabilitado(true);
        }
        GrupoDistritoConfig saved = repository.save(entity);
        auditService.log("GRUPO_DISTRITO_CONFIG", saved.getId(), "GRUPO_DISTRITO_ASOCIADO", null, null);
        return mapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        GrupoDistritoConfig config = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración grupo-distrito no encontrada"));
        long inmuebles = inmuebleRepository.countByGrupoIdAndDistritoId(config.getGrupo().getId(), config.getDistrito().getId());
        if (inmuebles > 0) {
            throw new ConflictException("No se puede eliminar la relación porque tiene inmuebles o procesos asociados.");
        }
        repository.delete(config);
        auditService.log("GRUPO_DISTRITO_CONFIG", id, "GRUPO_DISTRITO_DESASOCIADO", null, null);
    }

    private void validateActivos(Grupo grupo, Distrito distrito) {
        if (!grupo.isActivo()) {
            throw new ConflictException("No se puede configurar una relación con un grupo inactivo.");
        }
        if (!distrito.isActivo()) {
            throw new ConflictException("No se puede configurar una relación con un distrito inactivo.");
        }
    }
}

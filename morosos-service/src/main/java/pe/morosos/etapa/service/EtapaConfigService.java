package pe.morosos.etapa.service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.common.exception.ConflictException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.common.util.UsageValidationService;
import pe.morosos.etapa.dto.EtapaConfigRequest;
import pe.morosos.etapa.dto.EtapaConfigResponse;
import pe.morosos.etapa.dto.EtapaReordenarRequest;
import pe.morosos.etapa.entity.EtapaConfig;
import pe.morosos.etapa.mapper.EtapaConfigMapper;
import pe.morosos.etapa.repository.EtapaConfigRepository;
import pe.morosos.seguimiento.repository.CasoSeguimientoRepository;

@Service
@RequiredArgsConstructor
public class EtapaConfigService {

    private final EtapaConfigRepository repository;
    private final EtapaConfigMapper mapper;
    private final UsageValidationService usageValidationService;
    private final CasoSeguimientoRepository casoSeguimientoRepository;

    @Transactional(readOnly = true)
    public List<EtapaConfigResponse> findAll() {
        List<EtapaConfig> etapas = repository.findAllByOrderByOrdenAsc();
        List<UUID> etapaIds = etapas.stream().map(EtapaConfig::getId).toList();
        Map<UUID, Long> conteos = casoSeguimientoRepository.countByEtapaActualIds(etapaIds).stream()
                .collect(java.util.stream.Collectors.toMap(r -> (UUID) r[0], r -> ((Number) r[1]).longValue()));
        return etapas.stream().map(e -> mapper.toResponse(e, conteos.getOrDefault(e.getId(), 0L))).toList();
    }

    @Transactional
    public EtapaConfigResponse create(EtapaConfigRequest request) {
        validateUniqueness(request, null);
        return mapper.toResponse(repository.save(mapper.toEntity(request)));
    }

    @Transactional
    public EtapaConfigResponse update(UUID id, EtapaConfigRequest request) {
        EtapaConfig entity = findEntity(id);
        validateUniqueness(request, id);
        mapper.update(entity, request);
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public List<EtapaConfigResponse> reorder(EtapaReordenarRequest request) {
        Set<Integer> ordenes = new HashSet<>();
        for (EtapaReordenarRequest.Item item : request.etapas()) {
            if (!ordenes.add(item.orden())) {
                throw new ConflictException("No se pueden repetir órdenes en la reordenación");
            }
        }

        Map<UUID, EtapaConfig> existentes = repository.findAllById(request.etapas().stream().map(EtapaReordenarRequest.Item::id).toList())
                .stream()
                .collect(java.util.stream.Collectors.toMap(EtapaConfig::getId, Function.identity()));

        if (existentes.size() != request.etapas().size()) {
            throw new ResourceNotFoundException("Una o más etapas no existen");
        }

        request.etapas().forEach(item -> existentes.get(item.id()).setOrden(item.orden()));
        return repository.saveAll(existentes.values()).stream()
                .sorted(java.util.Comparator.comparing(EtapaConfig::getOrden))
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public void delete(UUID id) {
        EtapaConfig entity = findEntity(id);
        if (usageValidationService.hasRelatedRows("caso_seguimiento", "etapa_actual_id", id)
                || usageValidationService.hasRelatedRows("caso_evento", "etapa_origen_id", id)
                || usageValidationService.hasRelatedRows("caso_evento", "etapa_destino_id", id)) {
            throw new BusinessRuleException("No se puede eliminar una etapa en uso");
        }
        repository.delete(entity);
    }

    private EtapaConfig findEntity(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Etapa no encontrada"));
    }

    private void validateUniqueness(EtapaConfigRequest request, UUID id) {
        boolean codigoDuplicado = id == null
                ? repository.existsByCodigoIgnoreCase(request.codigo().trim())
                : repository.existsByCodigoIgnoreCaseAndIdNot(request.codigo().trim(), id);
        if (codigoDuplicado) {
            throw new ConflictException("Ya existe una etapa con el mismo código");
        }

        boolean ordenDuplicado = id == null
                ? repository.existsByOrden(request.orden())
                : repository.existsByOrdenAndIdNot(request.orden(), id);
        if (ordenDuplicado) {
            throw new ConflictException("El orden de la etapa ya está en uso");
        }
    }
}

package pe.morosos.audit.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import pe.morosos.audit.dto.AuditLogResponse;
import pe.morosos.audit.entity.AuditLog;
import pe.morosos.audit.repository.AuditLogRepository;

@Service
@RequiredArgsConstructor
public class AuditoriaConsultaService {
    private final AuditLogRepository auditLogRepository;

    public Page<AuditLogResponse> buscarMovimientos(String entityType, UUID entityId, String action, UUID actorId,
                                                    LocalDate fechaDesde, LocalDate fechaHasta, Pageable pageable) {
        Specification<AuditLog> spec = Specification.where(null);
        if (entityType != null && !entityType.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("entityType"), entityType));
        }
        if (entityId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("entityId"), entityId));
        }
        if (action != null && !action.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("action"), action));
        }
        if (actorId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("actorId"), actorId));
        }
        if (fechaDesde != null) {
            Instant desde = fechaDesde.atStartOfDay().toInstant(ZoneOffset.UTC);
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), desde));
        }
        if (fechaHasta != null) {
            Instant hasta = fechaHasta.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
            spec = spec.and((root, query, cb) -> cb.lessThan(root.get("createdAt"), hasta));
        }
        return auditLogRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(log.getId(), log.getEntityType(), log.getEntityId(), log.getAction(), log.getActorId(),
                log.getTraceId(), log.getRequestPath(), log.getOldValues(), log.getNewValues(), log.getCreatedAt());
    }
}

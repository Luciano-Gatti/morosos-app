package pe.morosos.auth.admin.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.auth.admin.dto.AuthAuditResponse;
import pe.morosos.auth.audit.entity.AuditLog;
import pe.morosos.auth.audit.repository.AuditLogRepository;

@Service
public class AuthAuditQueryService {

    private final AuditLogRepository auditLogRepository;

    public AuthAuditQueryService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public Page<AuthAuditResponse> search(
            String usuario,
            String accion,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        OffsetDateTime fromDate = fechaDesde == null ? null : fechaDesde.atStartOfDay().atOffset(OffsetDateTime.now().getOffset());
        OffsetDateTime toDate = fechaHasta == null ? null : fechaHasta.plusDays(1).atStartOfDay().atOffset(OffsetDateTime.now().getOffset()).minusNanos(1);
        return auditLogRepository.search(null, usuario, accion, fromDate, toDate, pageable)
                .map(this::toResponse);
    }

    private AuthAuditResponse toResponse(AuditLog log) {
        return new AuthAuditResponse(
                log.getId(),
                log.getEntityType(),
                log.getEntityId(),
                log.getAction(),
                log.getActorId(),
                log.getTraceId(),
                log.getRequestPath(),
                log.getOldValues(),
                log.getNewValues(),
                log.getCreatedAt()
        );
    }
}

package pe.morosos.audit.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.audit.entity.AuditLog;
import pe.morosos.audit.repository.AuditLogRepository;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuditLog log(String entityType,
                        UUID entityId,
                        String action,
                        UUID actorId,
                        String traceId,
                        String requestPath,
                        JsonNode oldValues,
                        JsonNode newValues) {
        AuditLog log = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .actorId(actorId)
                .traceId(traceId)
                .requestPath(requestPath)
                .oldValues(oldValues)
                .newValues(newValues)
                .createdAt(Instant.now())
                .build();

        return auditLogRepository.save(log);
    }
}

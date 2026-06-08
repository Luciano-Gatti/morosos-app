package pe.morosos.auth.admin.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuthAuditResponse(
        UUID id,
        String entityType,
        String entityId,
        String action,
        String actorId,
        String traceId,
        String requestPath,
        String oldValues,
        String newValues,
        OffsetDateTime createdAt
) {
}

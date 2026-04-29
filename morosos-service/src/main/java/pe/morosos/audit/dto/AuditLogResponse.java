package pe.morosos.audit.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        String entityType,
        UUID entityId,
        String action,
        UUID actorId,
        String traceId,
        String requestPath,
        JsonNode oldValues,
        JsonNode newValues,
        OffsetDateTime createdAt
) {
    public AuditLogResponse(UUID id, String entityType, UUID entityId, String action, UUID actorId, String traceId,
                            String requestPath, JsonNode oldValues, JsonNode newValues, Instant createdAt) {
        this(id, entityType, entityId, action, actorId, traceId, requestPath, oldValues, newValues,
                createdAt == null ? null : createdAt.atOffset(ZoneOffset.UTC));
    }
}

package pe.morosos.reporte.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MovimientoReporteResponse(OffsetDateTime fecha, String action, String entityType, UUID entityId,
                                        UUID actorId, String resumen, JsonNode oldValues, JsonNode newValues) {}

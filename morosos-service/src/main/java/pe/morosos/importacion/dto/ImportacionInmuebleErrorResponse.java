package pe.morosos.importacion.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record ImportacionInmuebleErrorResponse(UUID id, UUID importacionId, Integer fila, String cuenta,
                                               String motivo, JsonNode payload, String createdBy, Instant createdAt) {}

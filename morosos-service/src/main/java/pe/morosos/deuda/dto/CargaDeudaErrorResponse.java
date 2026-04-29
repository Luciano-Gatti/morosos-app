package pe.morosos.deuda.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record CargaDeudaErrorResponse(
        UUID id,
        UUID cargaDeudaId,
        Integer fila,
        String cuenta,
        String motivo,
        JsonNode payload,
        String createdBy,
        Instant createdAt
) {
}

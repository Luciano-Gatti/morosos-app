package pe.morosos.dashboard.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DashboardMovimientoResponse(
        OffsetDateTime fecha,
        String tipo,
        String cuenta,
        String titular,
        String etapa,
        UUID actorId,
        String categoria
) {}

package pe.morosos.inmueble.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ResumenOperativoResponse(
        OffsetDateTime ultimaGestion,
        UUID etapaActualId,
        String etapaActualNombre,
        String estadoProceso,
        Integer periodosAdeudados,
        BigDecimal montoAdeudado
) {
}

package pe.morosos.deuda.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CargaDeudaDetalleResponse(
        UUID id,
        UUID cargaDeudaId,
        UUID inmuebleId,
        String cuenta,
        Integer cuotasVencidas,
        BigDecimal montoVencido,
        LocalDate fechaUltimoVencimiento,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt
) {
}

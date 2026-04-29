package pe.morosos.deuda.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import pe.morosos.deuda.entity.CargaDeudaEstado;

public record CargaDeudaResponse(
        UUID id,
        LocalDate periodo,
        CargaDeudaEstado estado,
        String archivoNombre,
        Integer totalRegistros,
        Integer procesados,
        Integer errores,
        BigDecimal montoTotal,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt
) {
}

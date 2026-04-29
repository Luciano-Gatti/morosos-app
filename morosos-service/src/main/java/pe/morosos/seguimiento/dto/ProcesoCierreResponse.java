package pe.morosos.seguimiento.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProcesoCierreResponse(
        UUID id,
        UUID casoSeguimientoId,
        String motivoCodigo,
        OffsetDateTime fechaCierre,
        String observacion,
        Object planPago,
        Object cambioParametro
) {
}

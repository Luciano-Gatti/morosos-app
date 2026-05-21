package pe.morosos.seguimiento.dto;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

public record HistorialCierreResponse(
        UUID procesoCierreId,
        UUID casoId,
        UUID motivoCierreId,
        String motivoCierreCodigo,
        String motivoCierreNombre,
        OffsetDateTime fechaCierre,
        String observacionCierre,
        UUID responsableCierre,
        Object planPago,
        Object cambioParametro
) {
    public HistorialCierreResponse(
            UUID procesoCierreId,
            UUID casoId,
            UUID motivoCierreId,
            String motivoCierreCodigo,
            String motivoCierreNombre,
            Instant fechaCierre,
            String observacionCierre,
            UUID responsableCierre,
            Object planPago,
            Object cambioParametro
    ) {
        this(
                procesoCierreId,
                casoId,
                motivoCierreId,
                motivoCierreCodigo,
                motivoCierreNombre,
                fechaCierre == null ? null : fechaCierre.atOffset(ZoneOffset.UTC),
                observacionCierre,
                responsableCierre,
                planPago,
                cambioParametro
        );
    }
}

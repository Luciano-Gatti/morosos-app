package pe.morosos.seguimiento.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

public record SeguimientoBandejaRowResponse(
        UUID casoId,
        UUID inmuebleId,
        String cuenta,
        String titular,
        String direccion,
        UUID grupoId,
        String grupo,
        UUID distritoId,
        String distrito,
        Integer cuotasAdeudadas,
        BigDecimal montoAdeudado,
        UUID etapaId,
        String etapaActual,
        String estadoCaso,
        OffsetDateTime fechaUltimoMovimiento,
        Long diasDesdeUltimoMovimiento,
        SeguimientoBandejaAccionesResponse accionesDisponibles
) {
    public SeguimientoBandejaRowResponse(UUID casoId, UUID inmuebleId, String cuenta, String titular, String direccion,
                                         UUID grupoId, String grupo, UUID distritoId, String distrito,
                                         Integer cuotasAdeudadas, BigDecimal montoAdeudado,
                                         UUID etapaId, String etapaActual, String estadoCaso, Instant fechaUltimoMovimiento,
                                         Long diasDesdeUltimoMovimiento, SeguimientoBandejaAccionesResponse accionesDisponibles) {
        this(casoId, inmuebleId, cuenta, titular, direccion, grupoId, grupo, distritoId, distrito, cuotasAdeudadas, montoAdeudado, etapaId, etapaActual,
                estadoCaso, fechaUltimoMovimiento == null ? null : fechaUltimoMovimiento.atOffset(ZoneOffset.UTC),
                diasDesdeUltimoMovimiento, accionesDisponibles);
    }
}

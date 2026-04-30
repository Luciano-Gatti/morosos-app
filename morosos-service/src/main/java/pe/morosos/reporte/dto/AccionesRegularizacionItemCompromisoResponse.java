package pe.morosos.reporte.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AccionesRegularizacionItemCompromisoResponse(
        LocalDate fechaDesde,
        LocalDate fechaHasta,
        String cuenta,
        String titular,
        UUID inmuebleId,
        UUID casoId,
        UUID grupoId,
        String grupoNombre,
        UUID distritoId,
        String distritoNombre,
        String estado,
        String estadoLabel,
        BigDecimal montoComprometido,
        UUID actorId,
        String observacion
) {}

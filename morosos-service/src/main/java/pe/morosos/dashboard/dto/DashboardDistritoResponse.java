package pe.morosos.dashboard.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record DashboardDistritoResponse(
        UUID distritoId,
        String distritoNombre,
        long totalInmuebles,
        long alDia,
        long deudores,
        long morosos,
        double porcentajeMorosidad,
        BigDecimal montoTotalDeuda,
        long avisosDeuda,
        long avisosCorte,
        long intimaciones,
        long cortes
) {}

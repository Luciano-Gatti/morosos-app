package pe.morosos.dashboard.dto;

import java.math.BigDecimal;

public record DashboardKpisResponse(
        long totalInmuebles,
        long alDia,
        long deudores,
        long morosos,
        double porcentajeMorosidad,
        BigDecimal montoTotalDeuda
) {}

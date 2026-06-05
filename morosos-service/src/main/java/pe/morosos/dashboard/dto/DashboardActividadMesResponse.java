package pe.morosos.dashboard.dto;

import java.math.BigDecimal;

public record DashboardActividadMesResponse(
        long regularizacionesYPlanes,
        long compromisosPago,
        BigDecimal montoRecaudado,
        BigDecimal deudaVigente
) {}

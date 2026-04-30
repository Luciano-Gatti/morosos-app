package pe.morosos.dashboard.dto;

public record DashboardAccionesMesResponse(
        long avisosDeuda,
        long avisosCorte,
        long intimaciones,
        long cortes,
        long regularizaciones,
        long planesPago,
        long compromisosPago
) {}

package pe.morosos.reporte.dto;

public record AccionesRegularizacionResumenResponse(
        long totalAcciones,
        long regularizaciones,
        long planesPago,
        long compromisosPago,
        double porcentajeRegularizaciones,
        double porcentajePlanesPago
) {}

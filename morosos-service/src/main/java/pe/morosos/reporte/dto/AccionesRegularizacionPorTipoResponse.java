package pe.morosos.reporte.dto;

public record AccionesRegularizacionPorTipoResponse(
        String tipo,
        long cantidad,
        double porcentaje
) {}

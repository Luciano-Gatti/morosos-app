package pe.morosos.reporte.dto;

public record AccionesRegularizacionPorTipoResponse(
        String tipo,
        String tipoLabel,
        long cantidad,
        double porcentaje
) {}

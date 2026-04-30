package pe.morosos.reporte.dto;

public record AccionesFechasPorTipoResponse(
        String tipoAccion,
        String tipoAccionLabel,
        long cantidad,
        double porcentaje
) {}

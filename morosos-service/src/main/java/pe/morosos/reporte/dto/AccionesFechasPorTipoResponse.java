package pe.morosos.reporte.dto;

public record AccionesFechasPorTipoResponse(
        String tipoAccion,
        long cantidad,
        double porcentaje
) {}

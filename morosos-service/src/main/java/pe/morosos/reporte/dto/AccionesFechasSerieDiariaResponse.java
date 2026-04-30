package pe.morosos.reporte.dto;

import java.time.LocalDate;

public record AccionesFechasSerieDiariaResponse(
        LocalDate fecha,
        long cantidad
) {}

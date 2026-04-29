package pe.morosos.reporte.dto;

import java.util.UUID;

public record EstadoInmueblesDistritoResponse(UUID distritoId, String distritoNombre, long total, long activos, long inactivos,
                                              long seguimientoHabilitado, long seguimientoDeshabilitado) {}

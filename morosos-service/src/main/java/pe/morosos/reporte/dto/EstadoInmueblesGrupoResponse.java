package pe.morosos.reporte.dto;

import java.util.UUID;

public record EstadoInmueblesGrupoResponse(UUID grupoId, String grupoNombre, long total, long activos, long inactivos,
                                           long seguimientoHabilitado, long seguimientoDeshabilitado) {}

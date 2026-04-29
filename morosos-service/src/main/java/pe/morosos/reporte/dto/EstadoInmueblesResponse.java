package pe.morosos.reporte.dto;

import java.util.List;

public record EstadoInmueblesResponse(long totalInmuebles, long activos, long inactivos, long seguimientoHabilitado,
                                      long seguimientoDeshabilitado, List<EstadoInmueblesGrupoResponse> porGrupo,
                                      List<EstadoInmueblesDistritoResponse> porDistrito) {}

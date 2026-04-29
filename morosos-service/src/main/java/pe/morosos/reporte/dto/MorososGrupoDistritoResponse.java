package pe.morosos.reporte.dto;

import java.util.List;

public record MorososGrupoDistritoResponse(long totalPadron, long totalDeudores, long totalMorosos, long totalAlDia,
                                           double porcentajeMorosidadGeneral,
                                           List<MorososGrupoDistritoRowResponse> filas,
                                           List<MorososGrupoDistritoDistritoResponse> porDistrito) {}

package pe.morosos.reporte.dto;

import java.util.List;

public record MorososGrupoDistritoResponse(
        long totalPadron,
        long totalDeudores,
        long totalMorosos,
        long totalAlDia,
        double porcentajeMorosidadGeneral,
        int parametroCuotasMoroso,
        List<MorososGrupoDistritoRowResponse> porDistritoGrupo,
        List<MorososGrupoDistritoRowResponse> porGrupo,
        List<MorososGrupoDistritoDistritoResponse> porDistrito,
        List<MorososGrupoDistritoRowResponse> filas) {}

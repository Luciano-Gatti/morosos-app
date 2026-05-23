package pe.morosos.dashboard.dto;

import java.util.List;

public record DashboardResumenResponse(
        DashboardKpisResponse kpis,
        DashboardActividadMesResponse actividadMes,
        DashboardAccionesMesResponse accionesMes,
        List<DashboardDistritoResponse> distritos,
        List<DashboardMovimientoResponse> ultimosMovimientos
) {}

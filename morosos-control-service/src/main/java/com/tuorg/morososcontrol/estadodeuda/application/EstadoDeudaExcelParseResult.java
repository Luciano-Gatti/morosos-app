package com.tuorg.morososcontrol.estadodeuda.application;

import java.util.List;

public record EstadoDeudaExcelParseResult(
        int totalProcesados,
        List<EstadoDeudaExcelRowData> rowsValidas,
        List<String> errores
) {
}

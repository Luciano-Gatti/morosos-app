package com.tuorg.morososcontrol.inmueble.application;

import java.util.List;

record InmuebleExcelParseResult(
        int totalProcesados,
        List<InmuebleExcelRowData> rowsValidas,
        List<String> errores
) {
}

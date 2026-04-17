package com.tuorg.morososcontrol.inmueble.application;

record InmuebleExcelRowData(
        int rowNumber,
        String numeroCuenta,
        String propietarioNombre,
        String distrito,
        String direccionCompleta,
        String segmento,
        boolean activo
) {
}

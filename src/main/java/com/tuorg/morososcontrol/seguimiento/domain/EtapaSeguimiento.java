package com.tuorg.morososcontrol.seguimiento.domain;

public enum EtapaSeguimiento {
    AVISO_DEUDA,
    INTIMACION,
    AVISO_CORTE,
    CORTE;

    public EtapaSeguimiento siguiente() {
        return switch (this) {
            case AVISO_DEUDA -> INTIMACION;
            case INTIMACION -> AVISO_CORTE;
            case AVISO_CORTE -> CORTE;
            case CORTE -> null;
        };
    }
}

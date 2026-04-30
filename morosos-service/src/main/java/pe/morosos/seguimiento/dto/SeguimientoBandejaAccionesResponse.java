package pe.morosos.seguimiento.dto;

public record SeguimientoBandejaAccionesResponse(
        boolean puedeIniciar,
        boolean puedeAvanzar,
        boolean puedeRepetir,
        boolean puedePausar,
        boolean puedeReabrir,
        boolean puedeCerrar,
        boolean puedeRegistrarCompromiso
) {}

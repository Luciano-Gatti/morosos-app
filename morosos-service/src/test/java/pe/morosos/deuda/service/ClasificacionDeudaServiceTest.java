package pe.morosos.deuda.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class ClasificacionDeudaServiceTest {

    private final ClasificacionDeudaService service = new ClasificacionDeudaService();

    @Test
    void clasificaConUmbralCinco() {
        assertEquals(EstadoDeuda.AL_DIA, service.clasificar(null, 5));
        assertEquals(EstadoDeuda.AL_DIA, service.clasificar(0, 5));
        assertEquals(EstadoDeuda.DEUDOR, service.clasificar(1, 5));
        assertEquals(EstadoDeuda.DEUDOR, service.clasificar(4, 5));
        assertEquals(EstadoDeuda.MOROSO, service.clasificar(5, 5));
        assertEquals(EstadoDeuda.MOROSO, service.clasificar(14, 5));
    }

    @Test
    void clasificaConCambioDeUmbral() {
        assertEquals(EstadoDeuda.DEUDOR, service.clasificar(5, 10));
        assertEquals(EstadoDeuda.MOROSO, service.clasificar(10, 10));
    }
}

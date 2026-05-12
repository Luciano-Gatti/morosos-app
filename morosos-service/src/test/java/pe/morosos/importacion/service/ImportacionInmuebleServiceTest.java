package pe.morosos.importacion.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import org.junit.jupiter.api.Test;

class ImportacionInmuebleServiceTest {

    @Test
    void parseActivo_devuelveTrue_siNoExisteColumna() {
        assertTrue(ImportacionInmuebleService.parseActivo(Map.of("cuenta", "1")));
    }

    @Test
    void parseActivo_devuelveTrue_siExisteVacio() {
        assertTrue(ImportacionInmuebleService.parseActivo(Map.of("activo", "   ")));
    }

    @Test
    void parseActivo_aceptaValoresTrue() {
        assertTrue(ImportacionInmuebleService.parseActivo(Map.of("activo", "si")));
        assertTrue(ImportacionInmuebleService.parseActivo(Map.of("activo", "SÍ")));
        assertTrue(ImportacionInmuebleService.parseActivo(Map.of("activo", "1")));
        assertTrue(ImportacionInmuebleService.parseActivo(Map.of("activo", "ACTIVO")));
        assertTrue(ImportacionInmuebleService.parseActivo(Map.of("activo", "alta")));
    }

    @Test
    void parseActivo_aceptaValoresFalse() {
        assertFalse(ImportacionInmuebleService.parseActivo(Map.of("activo", "no")));
        assertFalse(ImportacionInmuebleService.parseActivo(Map.of("activo", "0")));
        assertFalse(ImportacionInmuebleService.parseActivo(Map.of("activo", "INACTIVO")));
        assertFalse(ImportacionInmuebleService.parseActivo(Map.of("activo", "BAJA")));
    }

    @Test
    void parseActivo_rechazaValorInvalido() {
        assertThrows(IllegalArgumentException.class, () ->
                ImportacionInmuebleService.parseActivo(Map.of("activo", "quizas")));
    }
}

package pe.morosos.parametro.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.morosos.parametro.entity.ParametroSeguimiento;
import pe.morosos.parametro.repository.ParametroSeguimientoRepository;

@ExtendWith(MockitoExtension.class)
class ParametroSeguimientoRulesServiceTest {

    @Mock
    ParametroSeguimientoRepository repository;

    private ParametroSeguimientoRulesService service;

    @BeforeEach
    void setUp() {
        service = new ParametroSeguimientoRulesService(repository);
    }

    @Test
    void cuotasMinimasMorosidadUsaCodigoActualCuotasParaMoroso() {
        ParametroSeguimiento param = new ParametroSeguimiento();
        param.setValor("5");
        when(repository.findByCodigoIgnoreCase("CUOTAS_PARA_MOROSO")).thenReturn(Optional.of(param));

        int valor = service.cuotasMinimasMorosidad();

        assertEquals(5, valor);
    }

    @Test
    void cuotasMinimasMorosidadUsaCodigoLegacySiNoExisteElActual() {
        ParametroSeguimiento paramLegacy = new ParametroSeguimiento();
        paramLegacy.setValor("4");
        when(repository.findByCodigoIgnoreCase("CUOTAS_PARA_MOROSO")).thenReturn(Optional.empty());
        when(repository.findByCodigoIgnoreCase("CUOTAS_MINIMAS_MOROSIDAD")).thenReturn(Optional.of(paramLegacy));

        int valor = service.cuotasMinimasMorosidad();

        assertEquals(4, valor);
    }

    @Test
    void diasEntreEtapasPermiteCero() {
        ParametroSeguimiento param = new ParametroSeguimiento();
        param.setValor("0");
        when(repository.findByCodigoIgnoreCase("DIAS_ENTRE_ETAPAS")).thenReturn(Optional.of(param));

        int valor = service.diasMinimosEntreEtapas();

        assertEquals(0, valor);
    }

    @Test
    void diasEntreEtapasNegativoUsaDefaultTecnico() {
        ParametroSeguimiento param = new ParametroSeguimiento();
        param.setValor("-1");
        when(repository.findByCodigoIgnoreCase("DIAS_ENTRE_ETAPAS")).thenReturn(Optional.of(param));

        int valor = service.diasMinimosEntreEtapas();

        assertEquals(15, valor);
    }

    @Test
    void diasEntreEtapasNoNumericoLanzaErrorControlado() {
        ParametroSeguimiento param = new ParametroSeguimiento();
        param.setValor("abc");
        when(repository.findByCodigoIgnoreCase("DIAS_ENTRE_ETAPAS")).thenReturn(Optional.of(param));

        assertThrows(pe.morosos.common.exception.BusinessRuleException.class, () -> service.diasMinimosEntreEtapas());
    }
}

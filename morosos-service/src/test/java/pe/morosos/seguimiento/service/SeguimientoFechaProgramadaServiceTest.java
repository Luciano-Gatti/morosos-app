package pe.morosos.seguimiento.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.morosos.etapa.entity.EtapaConfig;
import pe.morosos.etapa.repository.EtapaConfigRepository;
import pe.morosos.parametro.service.ParametroSeguimientoRulesService;
import pe.morosos.seguimiento.entity.CasoEvento;
import pe.morosos.seguimiento.entity.CasoEventoTipo;
import pe.morosos.seguimiento.entity.CasoSeguimientoEstado;
import pe.morosos.seguimiento.repository.CasoEventoRepository;

@ExtendWith(MockitoExtension.class)
class SeguimientoFechaProgramadaServiceTest {

    @Mock
    CasoEventoRepository casoEventoRepository;
    @Mock
    EtapaConfigRepository etapaConfigRepository;
    @Mock
    ParametroSeguimientoRulesService parametroRulesService;

    private SeguimientoFechaProgramadaService service;

    @BeforeEach
    void setUp() {
        service = new SeguimientoFechaProgramadaService(casoEventoRepository, etapaConfigRepository, parametroRulesService);
    }

    @Test
    void calculaFechaProgramadaConFechaEntradaMasDiasEntreEtapas() {
        UUID casoId = UUID.randomUUID();
        UUID etapaId = UUID.randomUUID();
        when(parametroRulesService.diasMinimosEntreEtapas()).thenReturn(3);
        when(etapaConfigRepository.findFirstByOrdenGreaterThanAndActivoTrueOrderByOrdenAsc(2)).thenReturn(Optional.of(new EtapaConfig()));
        when(casoEventoRepository.findFirstByCasoSeguimientoIdAndEtapaDestinoIdAndTipoEventoInOrderByFechaEventoDesc(
                eq(casoId), eq(etapaId), any(Collection.class)))
                .thenReturn(Optional.of(evento(CasoEventoTipo.AVANCE_ETAPA, "2026-05-30T14:20:00Z")));

        var resultado = service.calcular(caso(casoId, etapaId, 2, CasoSeguimientoEstado.ABIERTO, false));

        assertEquals(LocalDate.of(2026, 5, 30), resultado.fechaEntradaEtapaActual());
        assertEquals(LocalDate.of(2026, 6, 2), resultado.fechaProgramada());
        assertEquals(3, resultado.diasEntreEtapasAplicado());
    }

    @Test
    void eventosInformativosPosterioresNoCambianLaFechaProgramada() {
        UUID casoId = UUID.randomUUID();
        UUID etapaId = UUID.randomUUID();
        when(parametroRulesService.diasMinimosEntreEtapas()).thenReturn(3);
        when(etapaConfigRepository.findFirstByOrdenGreaterThanAndActivoTrueOrderByOrdenAsc(2)).thenReturn(Optional.of(new EtapaConfig()));
        when(casoEventoRepository.findFirstByCasoSeguimientoIdAndEtapaDestinoIdAndTipoEventoInOrderByFechaEventoDesc(
                eq(casoId), eq(etapaId), any(Collection.class)))
                .thenReturn(Optional.of(evento(CasoEventoTipo.AVANCE_ETAPA, "2026-05-30T00:00:00Z")));

        var resultado = service.calcular(caso(casoId, etapaId, 2, CasoSeguimientoEstado.PAUSADO, false));

        assertEquals(LocalDate.of(2026, 6, 2), resultado.fechaProgramada());
    }

    @Test
    void repeticionDeEtapaReiniciaLaFechaEntrada() {
        UUID casoId = UUID.randomUUID();
        UUID etapaId = UUID.randomUUID();
        when(parametroRulesService.diasMinimosEntreEtapas()).thenReturn(3);
        when(etapaConfigRepository.findFirstByOrdenGreaterThanAndActivoTrueOrderByOrdenAsc(2)).thenReturn(Optional.of(new EtapaConfig()));
        when(casoEventoRepository.findFirstByCasoSeguimientoIdAndEtapaDestinoIdAndTipoEventoInOrderByFechaEventoDesc(
                eq(casoId), eq(etapaId), any(Collection.class)))
                .thenReturn(Optional.of(evento(CasoEventoTipo.REPETICION_ETAPA, "2026-06-01T09:00:00Z")));

        var resultado = service.calcular(caso(casoId, etapaId, 2, CasoSeguimientoEstado.ABIERTO, false));

        assertEquals(LocalDate.of(2026, 6, 1), resultado.fechaEntradaEtapaActual());
        assertEquals(LocalDate.of(2026, 6, 4), resultado.fechaProgramada());
    }

    @Test
    void procesoCerradoDevuelveFechaProgramadaNull() {
        when(parametroRulesService.diasMinimosEntreEtapas()).thenReturn(3);

        var resultado = service.calcular(caso(UUID.randomUUID(), UUID.randomUUID(), 2, CasoSeguimientoEstado.CERRADO, false));

        assertNull(resultado.fechaEntradaEtapaActual());
        assertNull(resultado.fechaProgramada());
        verify(casoEventoRepository, never()).findFirstByCasoSeguimientoIdAndEtapaDestinoIdAndTipoEventoInOrderByFechaEventoDesc(any(), any(), any());
    }

    @Test
    void ultimaEtapaSinSiguienteDevuelveFechaProgramadaNull() {
        when(parametroRulesService.diasMinimosEntreEtapas()).thenReturn(3);

        var resultadoFinal = service.calcular(caso(UUID.randomUUID(), UUID.randomUUID(), 4, CasoSeguimientoEstado.ABIERTO, true));

        assertNull(resultadoFinal.fechaProgramada());
        verify(etapaConfigRepository, never()).findFirstByOrdenGreaterThanAndActivoTrueOrderByOrdenAsc(any());
    }

    @Test
    void etapaNoFinalSinSiguienteConfiguradaDevuelveFechaProgramadaNull() {
        when(parametroRulesService.diasMinimosEntreEtapas()).thenReturn(3);
        when(etapaConfigRepository.findFirstByOrdenGreaterThanAndActivoTrueOrderByOrdenAsc(4)).thenReturn(Optional.empty());

        var resultado = service.calcular(caso(UUID.randomUUID(), UUID.randomUUID(), 4, CasoSeguimientoEstado.ABIERTO, false));

        assertNull(resultado.fechaProgramada());
        verify(casoEventoRepository, never()).findFirstByCasoSeguimientoIdAndEtapaDestinoIdAndTipoEventoInOrderByFechaEventoDesc(any(), any(), any());
    }

    @Test
    void siNoPuedeDeterminarFechaEntradaDevuelveNullSinRomper() {
        UUID casoId = UUID.randomUUID();
        UUID etapaId = UUID.randomUUID();
        when(parametroRulesService.diasMinimosEntreEtapas()).thenReturn(3);
        when(etapaConfigRepository.findFirstByOrdenGreaterThanAndActivoTrueOrderByOrdenAsc(2)).thenReturn(Optional.of(new EtapaConfig()));
        when(casoEventoRepository.findFirstByCasoSeguimientoIdAndEtapaDestinoIdAndTipoEventoInOrderByFechaEventoDesc(
                eq(casoId), eq(etapaId), any(Collection.class)))
                .thenReturn(Optional.empty());

        var resultado = service.calcular(caso(casoId, etapaId, 2, CasoSeguimientoEstado.ABIERTO, false));

        assertNull(resultado.fechaEntradaEtapaActual());
        assertNull(resultado.fechaProgramada());
    }

    private SeguimientoFechaProgramadaService.UUIDCasoEtapa caso(UUID casoId, UUID etapaId, Integer orden,
                                                                 CasoSeguimientoEstado estado, Boolean etapaFinal) {
        return new SeguimientoFechaProgramadaService.UUIDCasoEtapa(casoId, etapaId, orden, estado, etapaFinal);
    }

    private CasoEvento evento(CasoEventoTipo tipo, String fechaEvento) {
        CasoEvento evento = new CasoEvento();
        evento.setTipoEvento(tipo);
        evento.setFechaEvento(Instant.parse(fechaEvento));
        return evento;
    }
}

package pe.morosos.seguimiento.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.morosos.audit.service.AuditService;
import pe.morosos.common.exception.ConflictException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.common.exception.ValidationException;
import pe.morosos.deuda.repository.CargaDeudaDetalleRepository;
import pe.morosos.deuda.repository.CargaDeudaRepository;
import pe.morosos.deuda.service.DeudaEfectivaService;
import pe.morosos.etapa.entity.EtapaConfig;
import pe.morosos.etapa.repository.EtapaConfigRepository;
import pe.morosos.inmueble.repository.InmuebleRepository;
import pe.morosos.parametro.service.ParametroSeguimientoRulesService;
import pe.morosos.seguimiento.MotorReglasSeguimiento;
import pe.morosos.seguimiento.dto.BulkActionResultResponse;
import pe.morosos.seguimiento.dto.EnviarEtapaRequest;
import pe.morosos.seguimiento.entity.CasoEventoTipo;
import pe.morosos.seguimiento.entity.CasoSeguimiento;
import pe.morosos.seguimiento.entity.CasoSeguimientoEstado;
import pe.morosos.seguimiento.repository.CasoEventoRepository;
import pe.morosos.seguimiento.repository.CasoSeguimientoRepository;
import pe.morosos.seguimiento.repository.CompromisoPagoRepository;
import pe.morosos.seguimiento.repository.ProcesoCierreCambioParametroRepository;
import pe.morosos.seguimiento.repository.ProcesoCierrePlanPagoRepository;
import pe.morosos.seguimiento.repository.ProcesoCierreRepository;

@ExtendWith(MockitoExtension.class)
class SeguimientoServiceEnviarEtapaTest {

    @Mock MotorReglasSeguimiento motor;
    @Mock CasoSeguimientoRepository casoRepository;
    @Mock EtapaConfigRepository etapaRepository;
    @Mock CasoEventoService casoEventoService;
    @Mock ProcesoCierreService procesoCierreService;
    @Mock CompromisoPagoService compromisoPagoService;
    @Mock AuditService auditService;
    @Mock com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    @Mock CargaDeudaRepository cargaDeudaRepository;
    @Mock CargaDeudaDetalleRepository cargaDeudaDetalleRepository;
    @Mock CasoEventoRepository casoEventoRepository;
    @Mock ProcesoCierreRepository procesoCierreRepository;
    @Mock ProcesoCierrePlanPagoRepository procesoCierrePlanPagoRepository;
    @Mock ProcesoCierreCambioParametroRepository procesoCierreCambioParametroRepository;
    @Mock CompromisoPagoRepository compromisoPagoRepository;
    @Mock InmuebleRepository inmuebleRepository;
    @Mock ParametroSeguimientoRulesService parametroRulesService;
    @Mock DeudaEfectivaService deudaEfectivaService;
    @Mock SeguimientoFechaProgramadaService fechaProgramadaService;

    @InjectMocks SeguimientoService service;

    @Captor ArgumentCaptor<Instant> fechaMovimientoCaptor;

    private UUID casoId;
    private UUID etapaOrigenId;
    private UUID etapaDestinoId;
    private EtapaConfig primeraEtapa;
    private EtapaConfig etapaOrigen;
    private EtapaConfig etapaDestino;
    private CasoSeguimiento caso;

    @BeforeEach
    void setUp() {
        casoId = UUID.randomUUID();
        etapaOrigenId = UUID.randomUUID();
        etapaDestinoId = UUID.randomUUID();
        primeraEtapa = etapa(etapaOrigenId, "Aviso de deuda", 1, true);
        etapaOrigen = primeraEtapa;
        etapaDestino = etapa(etapaDestinoId, "Intimación", 2, true);
        caso = caso(casoId, etapaOrigen, CasoSeguimientoEstado.ABIERTO);
    }

    @Test
    void enviarEtapaConPayloadValidoAplicaYCambiaEtapaActual() {
        stubDestinoYPrimeraEtapa();
        when(casoRepository.findById(casoId)).thenReturn(Optional.of(caso));
        when(casoRepository.save(caso)).thenReturn(caso);

        BulkActionResultResponse response = service.enviarEtapa(new EnviarEtapaRequest(
                List.of(casoId), etapaDestinoId, "Movimiento manual", false));

        assertThat(response.getAplicados()).isEqualTo(1);
        assertThat(response.getErrores()).isZero();
        assertThat(caso.getEtapaActual()).isSameAs(etapaDestino);
    }

    @Test
    void enviarEtapaActualizaFechaEntradaConLaFechaDelMovimiento() {
        stubDestinoYPrimeraEtapa();
        when(casoRepository.findById(casoId)).thenReturn(Optional.of(caso));
        when(casoRepository.save(caso)).thenReturn(caso);

        service.enviarEtapa(new EnviarEtapaRequest(List.of(casoId), etapaDestinoId, "Movimiento manual", false));

        verify(casoEventoService).crearEvento(
                eq(caso),
                eq(CasoEventoTipo.ENVIAR_ETAPA),
                eq(etapaOrigen),
                eq(etapaDestino),
                eq("Movimiento manual"),
                eq(null),
                fechaMovimientoCaptor.capture());
        assertThat(caso.getFechaUltimoMovimiento()).isEqualTo(fechaMovimientoCaptor.getValue());
        assertThat(caso.getUpdatedAt()).isEqualTo(fechaMovimientoCaptor.getValue());
    }

    @Test
    void enviarEtapaConEtapaDestinoNullDevuelveErrorDeValidacionControlado() {
        assertThatThrownBy(() -> service.enviarEtapa(new EnviarEtapaRequest(List.of(casoId), null, null, false)))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Request inválido");
    }

    @Test
    void enviarEtapaConEtapaInexistenteDevuelveNotFoundControlado() {
        when(etapaRepository.findById(etapaDestinoId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.enviarEtapa(new EnviarEtapaRequest(List.of(casoId), etapaDestinoId, null, false)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("La etapa destino no existe");
    }

    @Test
    void enviarEtapaConProcesoCerradoDevuelveConflictControlado() {
        stubDestinoYPrimeraEtapa();
        CasoSeguimiento cerrado = caso(casoId, etapaOrigen, CasoSeguimientoEstado.CERRADO);
        when(casoRepository.findById(casoId)).thenReturn(Optional.of(cerrado));

        assertThatThrownBy(() -> service.enviarEtapa(new EnviarEtapaRequest(List.of(casoId), etapaDestinoId, null, false)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("procesos cerrados");
    }

    @Test
    void enviarEtapaConCasoInexistenteDevuelveNotFoundControlado() {
        stubDestinoYPrimeraEtapa();
        when(casoRepository.findById(casoId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.enviarEtapa(new EnviarEtapaRequest(List.of(casoId), etapaDestinoId, null, false)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Caso de seguimiento no encontrado");
    }

    @Test
    void enviarEtapaHaciaAtrasDevuelveConflictControlado() {
        EtapaConfig anterior = etapa(UUID.randomUUID(), "Aviso de deuda", 1, true);
        EtapaConfig actual = etapa(UUID.randomUUID(), "Corte", 3, true);
        CasoSeguimiento casoEnEtapaPosterior = caso(casoId, actual, CasoSeguimientoEstado.ABIERTO);
        when(etapaRepository.findById(anterior.getId())).thenReturn(Optional.of(anterior));
        when(etapaRepository.findFirstByActivoTrueOrderByOrdenAsc()).thenReturn(Optional.of(anterior));
        when(casoRepository.findById(casoId)).thenReturn(Optional.of(casoEnEtapaPosterior));

        assertThatThrownBy(() -> service.enviarEtapa(new EnviarEtapaRequest(List.of(casoId), anterior.getId(), null, false)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("No se puede retroceder");
        assertThat(casoEnEtapaPosterior.getEtapaActual()).isSameAs(actual);
    }

    private void stubDestinoYPrimeraEtapa() {
        when(etapaRepository.findById(etapaDestinoId)).thenReturn(Optional.of(etapaDestino));
        when(etapaRepository.findFirstByActivoTrueOrderByOrdenAsc()).thenReturn(Optional.of(primeraEtapa));
    }

    private static EtapaConfig etapa(UUID id, String nombre, int orden, boolean activo) {
        EtapaConfig etapa = new EtapaConfig();
        etapa.setId(id);
        etapa.setNombre(nombre);
        etapa.setCodigo(nombre.toUpperCase().replace(' ', '_'));
        etapa.setOrden(orden);
        etapa.setActivo(activo);
        return etapa;
    }

    private static CasoSeguimiento caso(UUID id, EtapaConfig etapaActual, CasoSeguimientoEstado estado) {
        CasoSeguimiento caso = new CasoSeguimiento();
        caso.setId(id);
        caso.setEtapaActual(etapaActual);
        caso.setEstado(estado);
        caso.setFechaInicio(Instant.parse("2026-06-01T00:00:00Z"));
        caso.setFechaUltimoMovimiento(Instant.parse("2026-06-01T00:00:00Z"));
        caso.setCreatedAt(Instant.parse("2026-06-01T00:00:00Z"));
        return caso;
    }
}

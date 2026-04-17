package com.tuorg.morososcontrol.estadodeuda.application;

import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaImportResponse;
import com.tuorg.morososcontrol.estadodeuda.domain.CargaDeuda;
import com.tuorg.morososcontrol.estadodeuda.domain.EstadoDeuda;
import com.tuorg.morososcontrol.estadodeuda.domain.EstadoDeudaHistorico;
import com.tuorg.morososcontrol.estadodeuda.infrastructure.CargaDeudaRepository;
import com.tuorg.morososcontrol.estadodeuda.infrastructure.EstadoDeudaHistoricoRepository;
import com.tuorg.morososcontrol.estadodeuda.infrastructure.EstadoDeudaRepository;
import com.tuorg.morososcontrol.grupo.domain.Grupo;
import com.tuorg.morososcontrol.inmueble.domain.Inmueble;
import com.tuorg.morososcontrol.inmueble.infrastructure.InmuebleRepository;
import com.tuorg.morososcontrol.regla.domain.ConfiguracionGeneral;
import com.tuorg.morososcontrol.regla.infrastructure.ConfiguracionGeneralRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EstadoDeudaServiceImplTest {

    @Mock
    private EstadoDeudaRepository estadoDeudaRepository;
    @Mock
    private EstadoDeudaHistoricoRepository estadoDeudaHistoricoRepository;
    @Mock
    private CargaDeudaRepository cargaDeudaRepository;
    @Mock
    private InmuebleRepository inmuebleRepository;
    @Mock
    private ConfiguracionGeneralRepository configuracionGeneralRepository;
    @Mock
    private EstadoDeudaExcelParser estadoDeudaExcelParser;

    @InjectMocks
    private EstadoDeudaServiceImpl service;

    @Captor
    private ArgumentCaptor<List<EstadoDeuda>> estadosCaptor;

    @Captor
    private ArgumentCaptor<List<EstadoDeudaHistorico>> historicosCaptor;

    private Inmueble inmueblePresente;
    private Inmueble inmuebleAusente;

    @BeforeEach
    void setUp() {
        inmueblePresente = crearInmueble("CTA-001", true);
        inmuebleAusente = crearInmueble("CTA-002", true);

        when(inmuebleRepository.findAll()).thenReturn(List.of(inmueblePresente, inmuebleAusente));
        when(estadoDeudaRepository.findAll()).thenReturn(List.of());
        when(cargaDeudaRepository.save(any(CargaDeuda.class))).thenAnswer(invocation -> {
            CargaDeuda carga = invocation.getArgument(0);
            ReflectionTestUtils.setField(carga, "id", UUID.randomUUID());
            return carga;
        });
        when(estadoDeudaRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(estadoDeudaHistoricoRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ConfiguracionGeneral config = new ConfiguracionGeneral();
        config.setMinimoCuotasSeguimiento(2);
        when(configuracionGeneralRepository.findTopByOrderByIdAsc()).thenReturn(Optional.of(config));
    }

    @Test
    void importExcel_debeActualizarEstadoActualYGuardarHistoricoSoloParaInmueblesPresentes() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "deuda.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new byte[]{1, 2, 3}
        );

        EstadoDeudaExcelRowData rowPresente = new EstadoDeudaExcelRowData(
                2,
                "CTA-001",
                3,
                new BigDecimal("150.00"),
                null
        );
        when(estadoDeudaExcelParser.parse(file)).thenReturn(new EstadoDeudaExcelParseResult(1, List.of(rowPresente), List.of()));

        EstadoDeudaImportResponse response = service.importExcel(file, "Carga inicial");

        assertThat(response.totalProcesados()).isEqualTo(1);
        assertThat(response.actualizados()).isEqualTo(2);

        org.mockito.Mockito.verify(estadoDeudaRepository).saveAll(estadosCaptor.capture());
        List<EstadoDeuda> estados = estadosCaptor.getValue();
        assertThat(estados).hasSize(2);

        EstadoDeuda estadoPresente = estados.stream()
                .filter(e -> e.getInmueble().getId().equals(inmueblePresente.getId()))
                .findFirst()
                .orElseThrow();
        assertThat(estadoPresente.getCuotasAdeudadas()).isEqualTo(3);
        assertThat(estadoPresente.getMontoAdeudado()).isEqualByComparingTo("150.00");

        EstadoDeuda estadoAusente = estados.stream()
                .filter(e -> e.getInmueble().getId().equals(inmuebleAusente.getId()))
                .findFirst()
                .orElseThrow();
        assertThat(estadoAusente.getCuotasAdeudadas()).isZero();
        assertThat(estadoAusente.getMontoAdeudado()).isEqualByComparingTo(BigDecimal.ZERO);

        org.mockito.Mockito.verify(estadoDeudaHistoricoRepository).saveAll(historicosCaptor.capture());
        List<EstadoDeudaHistorico> historicos = historicosCaptor.getValue();
        assertThat(historicos).hasSize(1);
        assertThat(historicos.getFirst().getInmueble().getId()).isEqualTo(inmueblePresente.getId());
        assertThat(historicos.getFirst().getAptoParaSeguimiento()).isTrue();
    }

    @Test
    void importExcel_debeGuardarAptoEnFalsoSiCuotasEsCero() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "deuda.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new byte[]{1, 2, 3}
        );

        EstadoDeudaExcelRowData rowPresente = new EstadoDeudaExcelRowData(
                2,
                "CTA-001",
                0,
                new BigDecimal("0.00"),
                null
        );
        when(estadoDeudaExcelParser.parse(file)).thenReturn(new EstadoDeudaExcelParseResult(1, List.of(rowPresente), List.of()));

        service.importExcel(file, null);

        org.mockito.Mockito.verify(estadoDeudaHistoricoRepository).saveAll(historicosCaptor.capture());
        List<EstadoDeudaHistorico> historicos = historicosCaptor.getValue();
        assertThat(historicos).hasSize(1);
        assertThat(historicos.getFirst().getCuotasAdeudadas()).isZero();
        assertThat(historicos.getFirst().getAptoParaSeguimiento()).isFalse();
    }

    private Inmueble crearInmueble(String numeroCuenta, boolean seguimientoHabilitado) {
        Grupo grupo = new Grupo();
        ReflectionTestUtils.setField(grupo, "id", UUID.randomUUID());
        grupo.setNombre("Grupo Test");

        Inmueble inmueble = new Inmueble();
        ReflectionTestUtils.setField(inmueble, "id", UUID.randomUUID());
        inmueble.setNumeroCuenta(numeroCuenta);
        inmueble.setPropietarioNombre("Propietario Test");
        inmueble.setDireccionCompleta("Direccion 123");
        inmueble.setDistrito("Distrito");
        inmueble.setGrupo(grupo);
        inmueble.setActivo(true);
        inmueble.setSeguimientoHabilitado(seguimientoHabilitado);
        return inmueble;
    }
}

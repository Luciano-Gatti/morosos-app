package com.tuorg.morososcontrol.estadodeuda.application;

import com.tuorg.morososcontrol.estadodeuda.api.dto.CargaDeudaDetalleItemResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.CargaDeudaListadoResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaImportResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.InmuebleEvolucionDeudaResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.MorososPorGrupoResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.ReporteMorososPorCargaResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaRequest;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.MorosoListadoResponse;
import com.tuorg.morososcontrol.estadodeuda.domain.CargaDeuda;
import com.tuorg.morososcontrol.estadodeuda.domain.EstadoDeuda;
import com.tuorg.morososcontrol.estadodeuda.domain.EstadoDeudaHistorico;
import com.tuorg.morososcontrol.estadodeuda.infrastructure.CargaDeudaRepository;
import com.tuorg.morososcontrol.estadodeuda.infrastructure.EstadoDeudaHistoricoRepository;
import com.tuorg.morososcontrol.estadodeuda.infrastructure.EstadoDeudaRepository;
import com.tuorg.morososcontrol.inmueble.domain.Inmueble;
import com.tuorg.morososcontrol.inmueble.infrastructure.InmuebleRepository;
import com.tuorg.morososcontrol.regla.domain.ConfiguracionGeneral;
import com.tuorg.morososcontrol.regla.infrastructure.ConfiguracionGeneralRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class EstadoDeudaServiceImpl implements EstadoDeudaService {

    private static final int MINIMO_CUOTAS_DEFAULT = 1;

    private final EstadoDeudaRepository estadoDeudaRepository;
    private final EstadoDeudaHistoricoRepository estadoDeudaHistoricoRepository;
    private final CargaDeudaRepository cargaDeudaRepository;
    private final InmuebleRepository inmuebleRepository;
    private final ConfiguracionGeneralRepository configuracionGeneralRepository;
    private final EstadoDeudaExcelParser estadoDeudaExcelParser;

    public EstadoDeudaServiceImpl(
            EstadoDeudaRepository estadoDeudaRepository,
            EstadoDeudaHistoricoRepository estadoDeudaHistoricoRepository,
            CargaDeudaRepository cargaDeudaRepository,
            InmuebleRepository inmuebleRepository,
            ConfiguracionGeneralRepository configuracionGeneralRepository,
            EstadoDeudaExcelParser estadoDeudaExcelParser
    ) {
        this.estadoDeudaRepository = estadoDeudaRepository;
        this.estadoDeudaHistoricoRepository = estadoDeudaHistoricoRepository;
        this.cargaDeudaRepository = cargaDeudaRepository;
        this.inmuebleRepository = inmuebleRepository;
        this.configuracionGeneralRepository = configuracionGeneralRepository;
        this.estadoDeudaExcelParser = estadoDeudaExcelParser;
    }

    @Override
    public EstadoDeudaResponse create(EstadoDeudaRequest request) {
        if (estadoDeudaRepository.existsByInmuebleId(request.inmuebleId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El inmueble ya tiene estado de deuda registrado");
        }

        Inmueble inmueble = obtenerInmueble(request.inmuebleId());

        EstadoDeuda estadoDeuda = new EstadoDeuda();
        estadoDeuda.setInmueble(inmueble);
        estadoDeuda.setCuotasAdeudadas(request.cuotasAdeudadas());
        estadoDeuda.setMontoAdeudado(request.montoAdeudado());
        estadoDeuda.setFechaActualizacion(LocalDateTime.now());

        return toResponse(estadoDeudaRepository.save(estadoDeuda));
    }

    @Override
    public EstadoDeudaResponse update(UUID id, EstadoDeudaRequest request) {
        EstadoDeuda estadoDeuda = estadoDeudaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estado de deuda no encontrado"));

        Inmueble inmueble = obtenerInmueble(request.inmuebleId());

        if (!estadoDeuda.getInmueble().getId().equals(inmueble.getId()) && estadoDeudaRepository.existsByInmuebleId(inmueble.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El inmueble ya tiene estado de deuda registrado");
        }

        estadoDeuda.setInmueble(inmueble);
        estadoDeuda.setCuotasAdeudadas(request.cuotasAdeudadas());
        estadoDeuda.setMontoAdeudado(request.montoAdeudado());
        estadoDeuda.setFechaActualizacion(LocalDateTime.now());

        return toResponse(estadoDeudaRepository.save(estadoDeuda));
    }

    @Override
    @Transactional(readOnly = true)
    public EstadoDeudaResponse findById(UUID id) {
        EstadoDeuda estadoDeuda = estadoDeudaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estado de deuda no encontrado"));

        return toResponse(estadoDeuda);
    }

    @Override
    @Transactional(readOnly = true)
    public EstadoDeudaResponse findByInmueble(UUID inmuebleId) {
        EstadoDeuda estadoDeuda = estadoDeudaRepository.findByInmuebleId(inmuebleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estado de deuda no encontrado para el inmueble"));

        return toResponse(estadoDeuda);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean calcularAptoParaSeguimiento(UUID inmuebleId) {
        EstadoDeuda estadoDeuda = estadoDeudaRepository.findByInmuebleId(inmuebleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estado de deuda no encontrado para el inmueble"));

        return calcularAptitud(estadoDeuda.getInmueble(), estadoDeuda.getCuotasAdeudadas());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MorosoListadoResponse> listarMorosos(
            String numeroCuenta,
            String propietarioNombre,
            String direccionCompleta,
            String distrito,
            String grupo,
            Integer cuotasAdeudadas,
            BigDecimal montoAdeudado,
            Boolean seguimientoHabilitado,
            Boolean aptoParaSeguimiento
    ) {
        return estadoDeudaRepository.findAll().stream()
                .map(this::toMorosoListado)
                .filter(item -> contieneIgnoreCase(item.numeroCuenta(), numeroCuenta))
                .filter(item -> contieneIgnoreCase(item.propietarioNombre(), propietarioNombre))
                .filter(item -> contieneIgnoreCase(item.direccionCompleta(), direccionCompleta))
                .filter(item -> contieneIgnoreCase(item.distrito(), distrito))
                .filter(item -> contieneIgnoreCase(item.grupo(), grupo))
                .filter(item -> equalsNullable(item.cuotasAdeudadas(), cuotasAdeudadas))
                .filter(item -> equalsMonto(item.montoAdeudado(), montoAdeudado))
                .filter(item -> equalsNullable(item.seguimientoHabilitado(), seguimientoHabilitado))
                .filter(item -> equalsNullable(item.aptoParaSeguimiento(), aptoParaSeguimiento))
                .toList();
    }

    @Override
    public EstadoDeudaImportResponse importExcel(MultipartFile file, String observacion) {
        EstadoDeudaExcelParseResult parseResult = estadoDeudaExcelParser.parse(file);

        CargaDeuda cargaDeuda = new CargaDeuda();
        cargaDeuda.setFechaCarga(LocalDateTime.now());
        cargaDeuda.setNombreArchivo(obtenerNombreArchivo(file));
        cargaDeuda.setObservacion(normalizeOptional(observacion));
        cargaDeuda = cargaDeudaRepository.save(cargaDeuda);

        List<String> errores = new ArrayList<>(parseResult.errores());
        List<String> cuentasNoEncontradas = new ArrayList<>();

        List<Inmueble> inmuebles = inmuebleRepository.findAll();
        Map<String, Inmueble> inmueblesPorCuenta = new HashMap<>();
        for (Inmueble inmueble : inmuebles) {
            inmueblesPorCuenta.put(normalizarCuenta(inmueble.getNumeroCuenta()), inmueble);
        }

        Map<UUID, EstadoDeudaExcelRowData> filasPorInmueble = new HashMap<>();
        for (EstadoDeudaExcelRowData row : parseResult.rowsValidas()) {
            Inmueble inmueble = inmueblesPorCuenta.get(normalizarCuenta(row.numeroCuenta()));
            if (inmueble == null) {
                cuentasNoEncontradas.add("Fila " + row.rowNumber() + ": " + row.numeroCuenta());
                continue;
            }

            EstadoDeudaExcelRowData existente = filasPorInmueble.put(inmueble.getId(), row);
            if (existente != null) {
                errores.add(
                        "Cuenta duplicada en Excel para inmueble " + inmueble.getNumeroCuenta()
                                + " (se usa la última fila: " + row.rowNumber() + ")"
                );
            }
        }

        Map<UUID, EstadoDeuda> estadoActualPorInmueble = new HashMap<>();
        for (EstadoDeuda estadoDeuda : estadoDeudaRepository.findAll()) {
            estadoActualPorInmueble.put(estadoDeuda.getInmueble().getId(), estadoDeuda);
        }

        List<EstadoDeuda> estadosAActualizar = new ArrayList<>();
        List<EstadoDeudaHistorico> historicosAGuardar = new ArrayList<>();
        LocalDateTime fechaProceso = LocalDateTime.now();

        for (Inmueble inmueble : inmuebles) {
            EstadoDeudaExcelRowData row = filasPorInmueble.get(inmueble.getId());

            Integer cuotas;
            BigDecimal monto;
            LocalDateTime fechaActualizacion;

            if (row == null) {
                cuotas = 0;
                monto = BigDecimal.ZERO;
                fechaActualizacion = fechaProceso;
            } else {
                cuotas = row.cuotasAdeudadas();
                monto = row.montoAdeudado();
                fechaActualizacion = row.fechaActualizacion() == null ? fechaProceso : row.fechaActualizacion();
            }

            boolean aptoParaSeguimiento = calcularAptoParaSeguimientoEnCarga(inmueble, cuotas, row != null);

            EstadoDeuda estadoActual = estadoActualPorInmueble.get(inmueble.getId());
            if (estadoActual == null) {
                estadoActual = new EstadoDeuda();
                estadoActual.setInmueble(inmueble);
            }
            estadoActual.setCuotasAdeudadas(cuotas);
            estadoActual.setMontoAdeudado(monto);
            estadoActual.setFechaActualizacion(fechaActualizacion);
            estadosAActualizar.add(estadoActual);

            EstadoDeudaHistorico historico = new EstadoDeudaHistorico();
            historico.setCargaDeuda(cargaDeuda);
            historico.setInmueble(inmueble);
            historico.setCuotasAdeudadas(cuotas);
            historico.setMontoAdeudado(monto);
            historico.setAptoParaSeguimiento(aptoParaSeguimiento);
            historico.setSeguimientoHabilitadoEnEseMomento(inmueble.isSeguimientoHabilitado());
            historicosAGuardar.add(historico);
        }

        estadoDeudaRepository.saveAll(estadosAActualizar);
        estadoDeudaHistoricoRepository.saveAll(historicosAGuardar);

        return new EstadoDeudaImportResponse(
                parseResult.totalProcesados(),
                estadosAActualizar.size(),
                errores.size(),
                cuentasNoEncontradas.size(),
                errores,
                cuentasNoEncontradas
        );
    }


    @Override
    @Transactional(readOnly = true)
    public List<CargaDeudaListadoResponse> listarCargas() {
        return cargaDeudaRepository.findAll().stream()
                .sorted((a, b) -> b.getFechaCarga().compareTo(a.getFechaCarga()))
                .map(carga -> new CargaDeudaListadoResponse(
                        carga.getId(),
                        carga.getFechaCarga(),
                        carga.getNombreArchivo(),
                        carga.getObservacion(),
                        estadoDeudaHistoricoRepository.countByCargaDeudaId(carga.getId())
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CargaDeudaDetalleItemResponse> detalleCarga(UUID cargaId) {
        if (!cargaDeudaRepository.existsById(cargaId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Carga de deuda no encontrada");
        }

        return estadoDeudaHistoricoRepository.findByCargaDeudaIdOrderByInmuebleNumeroCuentaAsc(cargaId).stream()
                .map(item -> new CargaDeudaDetalleItemResponse(
                        item.getInmueble().getId(),
                        item.getInmueble().getNumeroCuenta(),
                        item.getCuotasAdeudadas(),
                        item.getMontoAdeudado(),
                        Boolean.TRUE.equals(item.getAptoParaSeguimiento())
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InmuebleEvolucionDeudaResponse> evolucionInmueble(UUID inmuebleId) {
        if (!inmuebleRepository.existsById(inmuebleId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Inmueble no encontrado");
        }
        return construirEvolucionInmueble(inmuebleId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InmuebleEvolucionDeudaResponse> evolucionInmueblePorNumeroCuenta(String numeroCuenta) {
        Inmueble inmueble = inmuebleRepository.findByNumeroCuentaIgnoreCase(numeroCuenta == null ? "" : numeroCuenta.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inmueble no encontrado"));
        return construirEvolucionInmueble(inmueble.getId());
    }

    private List<InmuebleEvolucionDeudaResponse> construirEvolucionInmueble(UUID inmuebleId) {
        return estadoDeudaHistoricoRepository.findByInmuebleIdOrderByCargaDeudaFechaCargaAsc(inmuebleId).stream()
                .map(item -> new InmuebleEvolucionDeudaResponse(
                        item.getCargaDeuda().getFechaCarga(),
                        item.getCuotasAdeudadas(),
                        item.getMontoAdeudado(),
                        Boolean.TRUE.equals(item.getAptoParaSeguimiento()),
                        Boolean.TRUE.equals(item.getSeguimientoHabilitadoEnEseMomento()),
                        item.getCargaDeuda().getNombreArchivo()
                ))
                .toList();
    }


    @Override
    @Transactional(readOnly = true)
    public List<ReporteMorososPorCargaResponse> reporteMorososPorCarga() {
        Map<UUID, ReporteCargaAccumulator> acumuladoPorCarga = new LinkedHashMap<>();

        for (EstadoDeudaHistorico item : estadoDeudaHistoricoRepository.findAllByOrderByCargaDeudaFechaCargaAsc()) {
            ReporteCargaAccumulator cargaAcc = acumuladoPorCarga.computeIfAbsent(
                    item.getCargaDeuda().getId(),
                    ignored -> new ReporteCargaAccumulator(
                            item.getCargaDeuda().getId(),
                            item.getCargaDeuda().getFechaCarga(),
                            item.getCargaDeuda().getNombreArchivo()
                    )
            );

            if (item.getCuotasAdeudadas() == null || item.getCuotasAdeudadas() <= 0) {
                continue;
            }

            cargaAcc.cantidadTotalMorosos++;
            cargaAcc.montoTotalAdeudado = cargaAcc.montoTotalAdeudado.add(item.getMontoAdeudado());

            UUID grupoId = item.getInmueble().getGrupo().getId();
            String grupoNombre = item.getInmueble().getGrupo().getNombre();
            GrupoAccumulator grupoAcc = cargaAcc.grupos.computeIfAbsent(
                    grupoId,
                    ignored -> new GrupoAccumulator(grupoId, grupoNombre)
            );
            grupoAcc.cantidadMorosos++;
            grupoAcc.montoTotalAdeudado = grupoAcc.montoTotalAdeudado.add(item.getMontoAdeudado());
        }

        return acumuladoPorCarga.values().stream()
                .map(cargaAcc -> new ReporteMorososPorCargaResponse(
                        cargaAcc.idCarga,
                        cargaAcc.fechaCarga,
                        cargaAcc.nombreArchivo,
                        cargaAcc.cantidadTotalMorosos,
                        cargaAcc.montoTotalAdeudado,
                        cargaAcc.grupos.values().stream()
                                .map(grupoAcc -> new MorososPorGrupoResponse(
                                        grupoAcc.grupoId,
                                        grupoAcc.grupoNombre,
                                        grupoAcc.cantidadMorosos,
                                        grupoAcc.montoTotalAdeudado
                                ))
                                .toList()
                ))
                .toList();
    }

    private MorosoListadoResponse toMorosoListado(EstadoDeuda estadoDeuda) {
        Inmueble inmueble = estadoDeuda.getInmueble();
        boolean apto = calcularAptitud(inmueble, estadoDeuda.getCuotasAdeudadas());

        return new MorosoListadoResponse(
                inmueble.getId(),
                inmueble.getNumeroCuenta(),
                inmueble.getPropietarioNombre(),
                inmueble.getDireccionCompleta(),
                inmueble.getDistrito(),
                inmueble.getGrupo().getId(),
                inmueble.getGrupo().getNombre(),
                estadoDeuda.getCuotasAdeudadas(),
                estadoDeuda.getMontoAdeudado(),
                inmueble.isSeguimientoHabilitado(),
                apto,
                estadoDeuda.getFechaActualizacion()
        );
    }

    private EstadoDeudaResponse toResponse(EstadoDeuda estadoDeuda) {
        boolean apto = calcularAptitud(estadoDeuda.getInmueble(), estadoDeuda.getCuotasAdeudadas());
        return new EstadoDeudaResponse(
                estadoDeuda.getId(),
                estadoDeuda.getInmueble().getId(),
                estadoDeuda.getInmueble().getNumeroCuenta(),
                estadoDeuda.getCuotasAdeudadas(),
                estadoDeuda.getMontoAdeudado(),
                estadoDeuda.getFechaActualizacion(),
                apto
        );
    }

    private boolean calcularAptoParaSeguimientoEnCarga(Inmueble inmueble, Integer cuotasAdeudadas, boolean presenteEnExcel) {
        if (!presenteEnExcel) {
            return false;
        }
        if (cuotasAdeudadas == null || cuotasAdeudadas <= 0) {
            return false;
        }
        return calcularAptitud(inmueble, cuotasAdeudadas);
    }

    private boolean calcularAptitud(Inmueble inmueble, Integer cuotasAdeudadas) {
        int minimoCuotas = obtenerMinimoCuotasSeguimiento();
        return inmueble.isSeguimientoHabilitado() && cuotasAdeudadas >= minimoCuotas;
    }

    private int obtenerMinimoCuotasSeguimiento() {
        Integer valor = configuracionGeneralRepository.findTopByOrderByIdAsc()
                .map(ConfiguracionGeneral::getMinimoCuotasSeguimiento)
                .orElse(MINIMO_CUOTAS_DEFAULT);
        if (valor == null || valor < 1) {
            return MINIMO_CUOTAS_DEFAULT;
        }

        return valor;
    }

    private Inmueble obtenerInmueble(UUID inmuebleId) {
        return inmuebleRepository.findById(inmuebleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inmueble no encontrado"));
    }

    private String obtenerNombreArchivo(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            return "carga-deuda.xlsx";
        }
        return filename.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizarCuenta(String numeroCuenta) {
        if (numeroCuenta == null) {
            return "";
        }
        return numeroCuenta.trim().toLowerCase(Locale.ROOT);
    }

    private boolean contieneIgnoreCase(String valor, String filtro) {
        if (filtro == null || filtro.isBlank()) {
            return true;
        }
        return valor != null && valor.toLowerCase().contains(filtro.trim().toLowerCase());
    }

    private <T> boolean equalsNullable(T valor, T filtro) {
        if (filtro == null) {
            return true;
        }
        return filtro.equals(valor);
    }

    private boolean equalsMonto(BigDecimal valor, BigDecimal filtro) {
        if (filtro == null) {
            return true;
        }
        if (valor == null) {
            return false;
        }
        return valor.compareTo(filtro) == 0;
    }

    private static class ReporteCargaAccumulator {
        private final UUID idCarga;
        private final LocalDateTime fechaCarga;
        private final String nombreArchivo;
        private int cantidadTotalMorosos = 0;
        private BigDecimal montoTotalAdeudado = BigDecimal.ZERO;
        private final Map<UUID, GrupoAccumulator> grupos = new LinkedHashMap<>();

        private ReporteCargaAccumulator(UUID idCarga, LocalDateTime fechaCarga, String nombreArchivo) {
            this.idCarga = idCarga;
            this.fechaCarga = fechaCarga;
            this.nombreArchivo = nombreArchivo;
        }
    }

    private static class GrupoAccumulator {
        private final UUID grupoId;
        private final String grupoNombre;
        private int cantidadMorosos = 0;
        private BigDecimal montoTotalAdeudado = BigDecimal.ZERO;

        private GrupoAccumulator(UUID grupoId, String grupoNombre) {
            this.grupoId = grupoId;
            this.grupoNombre = grupoNombre;
        }
    }
}

package com.tuorg.morososcontrol.estadodeuda.application;

import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaRequest;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.MorosoListadoResponse;
import com.tuorg.morososcontrol.estadodeuda.domain.EstadoDeuda;
import com.tuorg.morososcontrol.estadodeuda.infrastructure.EstadoDeudaRepository;
import com.tuorg.morososcontrol.inmueble.domain.Inmueble;
import com.tuorg.morososcontrol.inmueble.infrastructure.InmuebleRepository;
import com.tuorg.morososcontrol.regla.domain.ConfiguracionGeneral;
import com.tuorg.morososcontrol.regla.infrastructure.ConfiguracionGeneralRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class EstadoDeudaServiceImpl implements EstadoDeudaService {

    private static final int MINIMO_CUOTAS_DEFAULT = 1;

    private final EstadoDeudaRepository estadoDeudaRepository;
    private final InmuebleRepository inmuebleRepository;
    private final ConfiguracionGeneralRepository configuracionGeneralRepository;

    public EstadoDeudaServiceImpl(
            EstadoDeudaRepository estadoDeudaRepository,
            InmuebleRepository inmuebleRepository,
            ConfiguracionGeneralRepository configuracionGeneralRepository
    ) {
        this.estadoDeudaRepository = estadoDeudaRepository;
        this.inmuebleRepository = inmuebleRepository;
        this.configuracionGeneralRepository = configuracionGeneralRepository;
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
}

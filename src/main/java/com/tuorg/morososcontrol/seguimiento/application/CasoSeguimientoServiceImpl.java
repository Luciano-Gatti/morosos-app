package com.tuorg.morososcontrol.seguimiento.application;

import com.tuorg.morososcontrol.estadodeuda.application.EstadoDeudaService;
import com.tuorg.morososcontrol.inmueble.domain.Inmueble;
import com.tuorg.morososcontrol.inmueble.infrastructure.InmuebleRepository;
import com.tuorg.morososcontrol.seguimiento.api.dto.CasoSeguimientoCreateRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.CasoSeguimientoResponse;
import com.tuorg.morososcontrol.seguimiento.api.dto.CerrarCasoSeguimientoRequest;
import com.tuorg.morososcontrol.seguimiento.domain.CasoSeguimiento;
import com.tuorg.morososcontrol.seguimiento.domain.CompromisoPago;
import com.tuorg.morososcontrol.seguimiento.domain.EstadoCompromiso;
import com.tuorg.morososcontrol.seguimiento.domain.EstadoSeguimiento;
import com.tuorg.morososcontrol.seguimiento.domain.EtapaSeguimiento;
import com.tuorg.morososcontrol.seguimiento.infrastructure.CasoSeguimientoRepository;
import com.tuorg.morososcontrol.seguimiento.infrastructure.CompromisoPagoRepository;
import com.tuorg.morososcontrol.shared.util.TextNormalizer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CasoSeguimientoServiceImpl implements CasoSeguimientoService {

    private final CasoSeguimientoRepository casoSeguimientoRepository;
    private final InmuebleRepository inmuebleRepository;
    private final EstadoDeudaService estadoDeudaService;
    private final CompromisoPagoRepository compromisoPagoRepository;

    public CasoSeguimientoServiceImpl(
            CasoSeguimientoRepository casoSeguimientoRepository,
            InmuebleRepository inmuebleRepository,
            EstadoDeudaService estadoDeudaService,
            CompromisoPagoRepository compromisoPagoRepository
    ) {
        this.casoSeguimientoRepository = casoSeguimientoRepository;
        this.inmuebleRepository = inmuebleRepository;
        this.estadoDeudaService = estadoDeudaService;
        this.compromisoPagoRepository = compromisoPagoRepository;
    }

    @Override
    public CasoSeguimientoResponse crearCaso(CasoSeguimientoCreateRequest request) {
        Inmueble inmueble = inmuebleRepository.findById(request.inmuebleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inmueble no encontrado"));

        validarInmuebleAptoParaSeguimiento(inmueble.getId());

        boolean yaTieneCasoAbierto = casoSeguimientoRepository.existsByInmuebleIdAndEstadoSeguimientoIn(
                inmueble.getId(),
                List.of(EstadoSeguimiento.ACTIVO, EstadoSeguimiento.PAUSADO)
        );

        if (yaTieneCasoAbierto) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El inmueble ya tiene un caso de seguimiento abierto");
        }

        CasoSeguimiento caso = new CasoSeguimiento();
        caso.setInmueble(inmueble);
        caso.setEstadoSeguimiento(EstadoSeguimiento.ACTIVO);
        caso.setEtapaActual(request.etapaInicial());
        caso.setFechaInicio(LocalDateTime.now());
        caso.setFechaCierre(null);
        caso.setMotivoCierre(null);

        return toResponse(casoSeguimientoRepository.save(caso));
    }

    @Override
    @Transactional(readOnly = true)
    public CasoSeguimientoResponse findById(UUID id) {
        CasoSeguimiento caso = obtenerCaso(id);
        return toResponse(caso);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CasoSeguimientoResponse> findAll(UUID inmuebleId, EstadoSeguimiento estadoSeguimiento) {
        List<CasoSeguimiento> casos;

        if (inmuebleId != null) {
            casos = casoSeguimientoRepository.findByInmuebleId(inmuebleId);
        } else if (estadoSeguimiento != null) {
            casos = casoSeguimientoRepository.findByEstadoSeguimiento(estadoSeguimiento);
        } else {
            casos = casoSeguimientoRepository.findAll();
        }

        return casos.stream().map(this::toResponse).toList();
    }

    @Override
    public CasoSeguimientoResponse avanzarEtapa(UUID casoId) {
        CasoSeguimiento caso = obtenerCaso(casoId);
        validarCasoEditable(caso);

        EtapaSeguimiento siguiente = caso.getEtapaActual().siguiente();
        if (siguiente == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No hay etapa siguiente disponible para este caso");
        }

        caso.setEtapaActual(siguiente);
        return toResponse(casoSeguimientoRepository.save(caso));
    }

    @Override
    public CasoSeguimientoResponse repetirEtapa(UUID casoId) {
        CasoSeguimiento caso = obtenerCaso(casoId);
        validarCasoEditable(caso);

        return toResponse(casoSeguimientoRepository.save(caso));
    }

    @Override
    public CasoSeguimientoResponse cerrarCaso(UUID casoId, CerrarCasoSeguimientoRequest request) {
        CasoSeguimiento caso = obtenerCaso(casoId);

        if (caso.getEstadoSeguimiento() == EstadoSeguimiento.CERRADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El caso ya se encuentra cerrado");
        }

        caso.setEstadoSeguimiento(EstadoSeguimiento.CERRADO);
        caso.setFechaCierre(LocalDateTime.now());
        caso.setMotivoCierre(TextNormalizer.normalizeRequired(request.motivoCierre()));

        return toResponse(casoSeguimientoRepository.save(caso));
    }

    private CasoSeguimiento obtenerCaso(UUID casoId) {
        return casoSeguimientoRepository.findById(casoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Caso de seguimiento no encontrado"));
    }

    private void validarInmuebleAptoParaSeguimiento(UUID inmuebleId) {
        boolean apto;
        try {
            apto = estadoDeudaService.calcularAptoParaSeguimiento(inmuebleId);
        } catch (ResponseStatusException ex) {
            apto = false;
        }

        if (!apto) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede crear caso: inmueble no apto para seguimiento");
        }
    }

    private void validarCasoEditable(CasoSeguimiento caso) {
        if (caso.getEstadoSeguimiento() == EstadoSeguimiento.CERRADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El caso está cerrado");
        }

        actualizarCompromisosVencidos(caso);

        if (caso.getEstadoSeguimiento() == EstadoSeguimiento.PAUSADO && tieneCompromisoVigente(caso.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El caso está pausado por compromiso vigente y no puede avanzar de etapa"
            );
        }
    }

    private void actualizarCompromisosVencidos(CasoSeguimiento caso) {
        LocalDate hoy = LocalDate.now();
        boolean huboIncumplidos = false;

        List<CompromisoPago> pendientes = compromisoPagoRepository
                .findByCasoSeguimientoIdAndEstadoCompromiso(caso.getId(), EstadoCompromiso.PENDIENTE);

        for (CompromisoPago compromiso : pendientes) {
            if (compromiso.getFechaHasta() != null && compromiso.getFechaHasta().isBefore(hoy)) {
                compromiso.setEstadoCompromiso(EstadoCompromiso.INCUMPLIDO);
                compromisoPagoRepository.save(compromiso);
                huboIncumplidos = true;
            }
        }

        if (huboIncumplidos && caso.getEstadoSeguimiento() == EstadoSeguimiento.PAUSADO) {
            caso.setEstadoSeguimiento(EstadoSeguimiento.ACTIVO);
            casoSeguimientoRepository.save(caso);
        }
    }

    private boolean tieneCompromisoVigente(UUID casoId) {
        LocalDate hoy = LocalDate.now();

        return compromisoPagoRepository
                .findByCasoSeguimientoIdAndEstadoCompromiso(casoId, EstadoCompromiso.PENDIENTE)
                .stream()
                .anyMatch(compromiso -> compromiso.getFechaHasta() == null || !compromiso.getFechaHasta().isBefore(hoy));
    }

    private CasoSeguimientoResponse toResponse(CasoSeguimiento caso) {
        return new CasoSeguimientoResponse(
                caso.getId(),
                caso.getInmueble().getId(),
                caso.getInmueble().getNumeroCuenta(),
                caso.getEstadoSeguimiento(),
                caso.getEtapaActual(),
                caso.getFechaInicio(),
                caso.getFechaCierre(),
                caso.getMotivoCierre()
        );
    }
}

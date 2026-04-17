package com.tuorg.morososcontrol.seguimiento.application;

import com.tuorg.morososcontrol.seguimiento.api.dto.CompromisoPagoRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.CompromisoPagoResponse;
import com.tuorg.morososcontrol.seguimiento.domain.CasoSeguimiento;
import com.tuorg.morososcontrol.seguimiento.domain.CompromisoPago;
import com.tuorg.morososcontrol.seguimiento.domain.EstadoCompromiso;
import com.tuorg.morososcontrol.seguimiento.domain.EstadoSeguimiento;
import com.tuorg.morososcontrol.seguimiento.infrastructure.CasoSeguimientoRepository;
import com.tuorg.morososcontrol.seguimiento.infrastructure.CompromisoPagoRepository;
import com.tuorg.morososcontrol.shared.util.TextNormalizer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CompromisoPagoServiceImpl implements CompromisoPagoService {

    private final CompromisoPagoRepository compromisoPagoRepository;
    private final CasoSeguimientoRepository casoSeguimientoRepository;

    public CompromisoPagoServiceImpl(
            CompromisoPagoRepository compromisoPagoRepository,
            CasoSeguimientoRepository casoSeguimientoRepository
    ) {
        this.compromisoPagoRepository = compromisoPagoRepository;
        this.casoSeguimientoRepository = casoSeguimientoRepository;
    }

    @Override
    public CompromisoPagoResponse registrarCompromiso(UUID casoSeguimientoId, CompromisoPagoRequest request) {
        CasoSeguimiento caso = obtenerCaso(casoSeguimientoId);
        validarCasoNoCerrado(caso);
        validarFechasCompromiso(request.fechaDesde(), request.fechaHasta());

        CompromisoPago compromiso = new CompromisoPago();
        compromiso.setCasoSeguimiento(caso);
        compromiso.setFechaDesde(request.fechaDesde());
        compromiso.setFechaHasta(request.fechaHasta());
        compromiso.setObservacion(TextNormalizer.normalizeNullable(request.observacion()));
        compromiso.setEstadoCompromiso(EstadoCompromiso.PENDIENTE);

        caso.setEstadoSeguimiento(EstadoSeguimiento.PAUSADO);
        casoSeguimientoRepository.save(caso);

        return toResponse(compromisoPagoRepository.save(compromiso));
    }

    @Override
    public CompromisoPagoResponse marcarIncumplido(UUID compromisoPagoId) {
        CompromisoPago compromiso = compromisoPagoRepository.findById(compromisoPagoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compromiso de pago no encontrado"));

        if (compromiso.getEstadoCompromiso() != EstadoCompromiso.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede incumplir un compromiso pendiente");
        }

        compromiso.setEstadoCompromiso(EstadoCompromiso.INCUMPLIDO);

        CasoSeguimiento caso = compromiso.getCasoSeguimiento();
        if (caso.getEstadoSeguimiento() == EstadoSeguimiento.PAUSADO) {
            caso.setEstadoSeguimiento(EstadoSeguimiento.ACTIVO);
            casoSeguimientoRepository.save(caso);
        }

        return toResponse(compromisoPagoRepository.save(compromiso));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompromisoPagoResponse> listarPorCaso(UUID casoSeguimientoId) {
        return compromisoPagoRepository.findByCasoSeguimientoIdOrderByFechaDesdeDesc(casoSeguimientoId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void actualizarCompromisosVencidos(UUID casoSeguimientoId) {
        CasoSeguimiento caso = obtenerCaso(casoSeguimientoId);

        List<CompromisoPago> pendientes = compromisoPagoRepository
                .findByCasoSeguimientoIdAndEstadoCompromiso(casoSeguimientoId, EstadoCompromiso.PENDIENTE);

        boolean huboIncumplidos = false;
        LocalDate hoy = LocalDate.now();

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

    private CasoSeguimiento obtenerCaso(UUID casoSeguimientoId) {
        return casoSeguimientoRepository.findById(casoSeguimientoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Caso de seguimiento no encontrado"));
    }

    private void validarCasoNoCerrado(CasoSeguimiento caso) {
        if (caso.getEstadoSeguimiento() == EstadoSeguimiento.CERRADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede registrar compromiso en un caso cerrado");
        }
    }

    private void validarFechasCompromiso(LocalDate fechaDesde, LocalDate fechaHasta) {
        if (fechaHasta != null && fechaHasta.isBefore(fechaDesde)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fechaHasta no puede ser anterior a fechaDesde");
        }
    }

    private CompromisoPagoResponse toResponse(CompromisoPago compromiso) {
        return new CompromisoPagoResponse(
                compromiso.getId(),
                compromiso.getCasoSeguimiento().getId(),
                compromiso.getFechaDesde(),
                compromiso.getFechaHasta(),
                compromiso.getObservacion(),
                compromiso.getEstadoCompromiso()
        );
    }
}

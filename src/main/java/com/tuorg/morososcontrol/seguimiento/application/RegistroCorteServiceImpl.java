package com.tuorg.morososcontrol.seguimiento.application;

import com.tuorg.morososcontrol.catalogo.domain.MotivoCorte;
import com.tuorg.morososcontrol.catalogo.domain.TipoCorte;
import com.tuorg.morososcontrol.catalogo.infrastructure.MotivoCorteRepository;
import com.tuorg.morososcontrol.catalogo.infrastructure.TipoCorteRepository;
import com.tuorg.morososcontrol.seguimiento.api.dto.RegistroCorteRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.RegistroCorteResponse;
import com.tuorg.morososcontrol.seguimiento.domain.CasoSeguimiento;
import com.tuorg.morososcontrol.seguimiento.domain.EstadoSeguimiento;
import com.tuorg.morososcontrol.seguimiento.domain.EtapaSeguimiento;
import com.tuorg.morososcontrol.seguimiento.domain.RegistroCorte;
import com.tuorg.morososcontrol.seguimiento.infrastructure.CasoSeguimientoRepository;
import com.tuorg.morososcontrol.seguimiento.infrastructure.RegistroCorteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RegistroCorteServiceImpl implements RegistroCorteService {

    private final RegistroCorteRepository registroCorteRepository;
    private final CasoSeguimientoRepository casoSeguimientoRepository;
    private final TipoCorteRepository tipoCorteRepository;
    private final MotivoCorteRepository motivoCorteRepository;

    public RegistroCorteServiceImpl(
            RegistroCorteRepository registroCorteRepository,
            CasoSeguimientoRepository casoSeguimientoRepository,
            TipoCorteRepository tipoCorteRepository,
            MotivoCorteRepository motivoCorteRepository
    ) {
        this.registroCorteRepository = registroCorteRepository;
        this.casoSeguimientoRepository = casoSeguimientoRepository;
        this.tipoCorteRepository = tipoCorteRepository;
        this.motivoCorteRepository = motivoCorteRepository;
    }

    @Override
    public RegistroCorteResponse registrar(UUID casoSeguimientoId, RegistroCorteRequest request) {
        CasoSeguimiento caso = casoSeguimientoRepository.findById(casoSeguimientoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Caso de seguimiento no encontrado"));

        if (caso.getEstadoSeguimiento() == EstadoSeguimiento.CERRADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede registrar corte en un caso cerrado");
        }

        if (caso.getEtapaActual() != EtapaSeguimiento.CORTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede registrar corte si el caso está en etapa CORTE");
        }

        TipoCorte tipoCorte = tipoCorteRepository.findById(request.tipoCorteId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo de corte no encontrado"));

        MotivoCorte motivoCorte = motivoCorteRepository.findById(request.motivoCorteId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Motivo de corte no encontrado"));

        if (!motivoCorte.isActivo()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede usar un motivo de corte inactivo");
        }

        RegistroCorte registro = new RegistroCorte();
        registro.setCasoSeguimiento(caso);
        registro.setFecha(request.fecha());
        registro.setTipoCorte(tipoCorte);
        registro.setMotivoCorte(motivoCorte);
        registro.setObservacion(request.observacion());

        return toResponse(registroCorteRepository.save(registro));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistroCorteResponse> listarPorCaso(UUID casoSeguimientoId) {
        if (!casoSeguimientoRepository.existsById(casoSeguimientoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Caso de seguimiento no encontrado");
        }

        return registroCorteRepository.findByCasoSeguimientoIdOrderByFechaDesc(casoSeguimientoId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private RegistroCorteResponse toResponse(RegistroCorte registro) {
        return new RegistroCorteResponse(
                registro.getId(),
                registro.getCasoSeguimiento().getId(),
                registro.getFecha(),
                registro.getTipoCorte().getId(),
                registro.getTipoCorte().getNombre(),
                registro.getMotivoCorte().getId(),
                registro.getMotivoCorte().getNombre(),
                registro.getObservacion()
        );
    }
}

package com.tuorg.morososcontrol.catalogo.application;

import com.tuorg.morososcontrol.catalogo.api.dto.TipoCorteRequest;
import com.tuorg.morososcontrol.catalogo.api.dto.TipoCorteResponse;
import com.tuorg.morososcontrol.catalogo.domain.TipoCorte;
import com.tuorg.morososcontrol.catalogo.infrastructure.TipoCorteRepository;
import com.tuorg.morososcontrol.shared.util.TextNormalizer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TipoCorteServiceImpl implements TipoCorteService {

    private final TipoCorteRepository tipoCorteRepository;

    public TipoCorteServiceImpl(TipoCorteRepository tipoCorteRepository) {
        this.tipoCorteRepository = tipoCorteRepository;
    }

    @Override
    public TipoCorteResponse create(TipoCorteRequest request) {
        String nombre = TextNormalizer.normalizeRequired(request.nombre());
        if (tipoCorteRepository.existsByNombreIgnoreCase(nombre)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un tipo de corte con ese nombre");
        }

        TipoCorte tipoCorte = new TipoCorte();
        tipoCorte.setNombre(nombre);

        return toResponse(tipoCorteRepository.save(tipoCorte));
    }

    @Override
    @Transactional(readOnly = true)
    public TipoCorteResponse findById(UUID id) {
        TipoCorte tipoCorte = tipoCorteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo de corte no encontrado"));
        return toResponse(tipoCorte);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TipoCorteResponse> findAll() {
        return tipoCorteRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public TipoCorteResponse update(UUID id, TipoCorteRequest request) {
        TipoCorte tipoCorte = tipoCorteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo de corte no encontrado"));

        String nombre = TextNormalizer.normalizeRequired(request.nombre());
        if (tipoCorteRepository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un tipo de corte con ese nombre");
        }

        tipoCorte.setNombre(nombre);
        return toResponse(tipoCorteRepository.save(tipoCorte));
    }

    @Override
    public void delete(UUID id) {
        if (!tipoCorteRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo de corte no encontrado");
        }

        tipoCorteRepository.deleteById(id);
    }

    private TipoCorteResponse toResponse(TipoCorte tipoCorte) {
        return new TipoCorteResponse(tipoCorte.getId(), tipoCorte.getNombre());
    }
}

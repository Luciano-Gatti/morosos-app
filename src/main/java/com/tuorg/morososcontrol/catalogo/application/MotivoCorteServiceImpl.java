package com.tuorg.morososcontrol.catalogo.application;

import com.tuorg.morososcontrol.catalogo.api.dto.MotivoCorteRequest;
import com.tuorg.morososcontrol.catalogo.api.dto.MotivoCorteResponse;
import com.tuorg.morososcontrol.catalogo.domain.MotivoCorte;
import com.tuorg.morososcontrol.catalogo.infrastructure.MotivoCorteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class MotivoCorteServiceImpl implements MotivoCorteService {

    private final MotivoCorteRepository motivoCorteRepository;
    private final MotivoCorteUsageChecker motivoCorteUsageChecker;

    public MotivoCorteServiceImpl(
            MotivoCorteRepository motivoCorteRepository,
            MotivoCorteUsageChecker motivoCorteUsageChecker
    ) {
        this.motivoCorteRepository = motivoCorteRepository;
        this.motivoCorteUsageChecker = motivoCorteUsageChecker;
    }

    @Override
    public MotivoCorteResponse create(MotivoCorteRequest request) {
        if (motivoCorteRepository.existsByNombre(request.nombre())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un motivo de corte con ese nombre");
        }

        MotivoCorte motivoCorte = new MotivoCorte();
        motivoCorte.setNombre(request.nombre());
        motivoCorte.setActivo(request.activo());

        return toResponse(motivoCorteRepository.save(motivoCorte));
    }

    @Override
    @Transactional(readOnly = true)
    public MotivoCorteResponse findById(UUID id) {
        MotivoCorte motivoCorte = motivoCorteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Motivo de corte no encontrado"));
        return toResponse(motivoCorte);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MotivoCorteResponse> findAll() {
        return motivoCorteRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MotivoCorteResponse> findOperativos() {
        return motivoCorteRepository.findByActivoTrue().stream().map(this::toResponse).toList();
    }

    @Override
    public MotivoCorteResponse update(UUID id, MotivoCorteRequest request) {
        MotivoCorte motivoCorte = motivoCorteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Motivo de corte no encontrado"));

        if (motivoCorteRepository.existsByNombreAndIdNot(request.nombre(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un motivo de corte con ese nombre");
        }

        motivoCorte.setNombre(request.nombre());
        motivoCorte.setActivo(request.activo());

        return toResponse(motivoCorteRepository.save(motivoCorte));
    }

    @Override
    public void delete(UUID id) {
        if (!motivoCorteRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Motivo de corte no encontrado");
        }

        if (motivoCorteUsageChecker.isUsed(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar el motivo de corte porque ya está siendo usado"
            );
        }

        motivoCorteRepository.deleteById(id);
    }

    private MotivoCorteResponse toResponse(MotivoCorte motivoCorte) {
        return new MotivoCorteResponse(
                motivoCorte.getId(),
                motivoCorte.getNombre(),
                motivoCorte.isActivo()
        );
    }
}

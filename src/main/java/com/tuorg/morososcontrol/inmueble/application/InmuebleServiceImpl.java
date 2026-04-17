package com.tuorg.morososcontrol.inmueble.application;

import com.tuorg.morososcontrol.grupo.domain.Grupo;
import com.tuorg.morososcontrol.grupo.infrastructure.GrupoRepository;
import com.tuorg.morososcontrol.inmueble.api.dto.InmuebleCreateRequest;
import com.tuorg.morososcontrol.inmueble.api.dto.InmuebleResponse;
import com.tuorg.morososcontrol.inmueble.domain.Inmueble;
import com.tuorg.morososcontrol.inmueble.infrastructure.InmuebleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class InmuebleServiceImpl implements InmuebleService {

    private final InmuebleRepository inmuebleRepository;
    private final GrupoRepository grupoRepository;

    public InmuebleServiceImpl(InmuebleRepository inmuebleRepository, GrupoRepository grupoRepository) {
        this.inmuebleRepository = inmuebleRepository;
        this.grupoRepository = grupoRepository;
    }

    @Override
    public InmuebleResponse create(InmuebleCreateRequest request) {
        if (inmuebleRepository.existsByNumeroCuenta(request.numeroCuenta())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un inmueble con ese número de cuenta");
        }

        Grupo grupo = grupoRepository.findById(request.grupoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grupo no encontrado"));

        Inmueble inmueble = new Inmueble();
        inmueble.setNumeroCuenta(request.numeroCuenta());
        inmueble.setPropietarioNombre(request.propietarioNombre());
        inmueble.setDistrito(request.distrito());
        inmueble.setDireccionCompleta(request.direccionCompleta());
        inmueble.setGrupo(grupo);
        inmueble.setActivo(request.activo());
        inmueble.setSeguimientoHabilitado(grupo.isSeguimientoActivo());

        return toResponse(inmuebleRepository.save(inmueble));
    }

    @Override
    @Transactional(readOnly = true)
    public InmuebleResponse findById(UUID id) {
        Inmueble inmueble = inmuebleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inmueble no encontrado"));
        return toResponse(inmueble);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InmuebleResponse> findAll(
            String numeroCuenta,
            String propietarioNombre,
            String direccionCompleta,
            String distrito
    ) {
        return inmuebleRepository
                .findByNumeroCuentaContainingIgnoreCaseAndPropietarioNombreContainingIgnoreCaseAndDireccionCompletaContainingIgnoreCaseAndDistritoContainingIgnoreCase(
                        safeFilter(numeroCuenta),
                        safeFilter(propietarioNombre),
                        safeFilter(direccionCompleta),
                        safeFilter(distrito)
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public InmuebleResponse update(UUID id, InmuebleCreateRequest request) {
        Inmueble inmueble = inmuebleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inmueble no encontrado"));

        if (inmuebleRepository.existsByNumeroCuentaAndIdNot(request.numeroCuenta(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un inmueble con ese número de cuenta");
        }

        Grupo grupo = grupoRepository.findById(request.grupoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grupo no encontrado"));

        inmueble.setNumeroCuenta(request.numeroCuenta());
        inmueble.setPropietarioNombre(request.propietarioNombre());
        inmueble.setDistrito(request.distrito());
        inmueble.setDireccionCompleta(request.direccionCompleta());
        inmueble.setGrupo(grupo);
        inmueble.setActivo(request.activo());
        inmueble.setSeguimientoHabilitado(grupo.isSeguimientoActivo());

        return toResponse(inmuebleRepository.save(inmueble));
    }

    @Override
    public void delete(UUID id) {
        if (!inmuebleRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Inmueble no encontrado");
        }
        inmuebleRepository.deleteById(id);
    }

    private InmuebleResponse toResponse(Inmueble inmueble) {
        return new InmuebleResponse(
                inmueble.getId(),
                inmueble.getNumeroCuenta(),
                inmueble.getPropietarioNombre(),
                inmueble.getDistrito(),
                inmueble.getDireccionCompleta(),
                inmueble.getGrupo().getId(),
                inmueble.getGrupo().getNombre(),
                inmueble.isActivo(),
                inmueble.isSeguimientoHabilitado()
        );
    }

    private String safeFilter(String value) {
        return value == null ? "" : value.trim();
    }
}

package com.tuorg.morososcontrol.grupo.application;

import com.tuorg.morososcontrol.grupo.api.dto.GrupoRequest;
import com.tuorg.morososcontrol.grupo.api.dto.GrupoResponse;
import com.tuorg.morososcontrol.grupo.domain.Grupo;
import com.tuorg.morososcontrol.grupo.infrastructure.GrupoRepository;
import com.tuorg.morososcontrol.shared.util.TextNormalizer;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class GrupoServiceImpl implements GrupoService {

    private final GrupoRepository grupoRepository;

    public GrupoServiceImpl(GrupoRepository grupoRepository) {
        this.grupoRepository = grupoRepository;
    }

    @Override
    public GrupoResponse create(GrupoRequest request) {
        String nombre = TextNormalizer.normalizeRequired(request.nombre());

        if (grupoRepository.existsByNombreIgnoreCase(nombre)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un grupo con ese nombre");
        }

        Grupo grupo = new Grupo();
        grupo.setNombre(nombre);
        grupo.setSeguimientoActivo(request.seguimientoActivo());

        return toResponse(grupoRepository.save(grupo));
    }

    @Override
    @Transactional(readOnly = true)
    public GrupoResponse findById(UUID id) {
        Grupo grupo = grupoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grupo no encontrado"));
        return toResponse(grupo);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrupoResponse> findAll() {
        return grupoRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public GrupoResponse update(UUID id, GrupoRequest request) {
        Grupo grupo = grupoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grupo no encontrado"));

        String nombre = TextNormalizer.normalizeRequired(request.nombre());

        if (grupoRepository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un grupo con ese nombre");
        }

        boolean seguimientoCambio = grupo.isSeguimientoActivo() != request.seguimientoActivo();

        grupo.setNombre(nombre);
        grupo.setSeguimientoActivo(request.seguimientoActivo());

        Grupo actualizado = grupoRepository.save(grupo);

        if (seguimientoCambio) {
            recalcularInmueblesAsociados(actualizado.getId());
        }

        return toResponse(actualizado);
    }

    @Override
    public void delete(UUID id) {
        if (!grupoRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Grupo no encontrado");
        }

        try {
            grupoRepository.deleteById(id);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede eliminar el grupo porque está en uso");
        }
    }

    @Override
    public void recalcularInmueblesAsociados(UUID grupoId) {
        // Punto de extensión para la próxima iteración:
        // recalcular elegibilidad de inmuebles asociados cuando cambia seguimientoActivo.
    }

    private GrupoResponse toResponse(Grupo grupo) {
        return new GrupoResponse(
                grupo.getId(),
                grupo.getNombre(),
                grupo.isSeguimientoActivo()
        );
    }
}

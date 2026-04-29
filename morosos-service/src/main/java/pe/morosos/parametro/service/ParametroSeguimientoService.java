package pe.morosos.parametro.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.parametro.dto.ParametroSeguimientoRequest;
import pe.morosos.parametro.dto.ParametroSeguimientoResponse;
import pe.morosos.parametro.entity.ParametroSeguimiento;
import pe.morosos.parametro.mapper.ParametroSeguimientoMapper;
import pe.morosos.parametro.repository.ParametroSeguimientoRepository;

@Service
@RequiredArgsConstructor
public class ParametroSeguimientoService {

    private final ParametroSeguimientoRepository repository;
    private final ParametroSeguimientoMapper mapper;

    @Transactional(readOnly = true)
    public List<ParametroSeguimientoResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public ParametroSeguimientoResponse updateByCodigo(String codigo, ParametroSeguimientoRequest request) {
        ParametroSeguimiento parametro = repository.findByCodigoIgnoreCase(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Parámetro de seguimiento no encontrado"));
        mapper.update(parametro, request);
        return mapper.toResponse(repository.save(parametro));
    }
}

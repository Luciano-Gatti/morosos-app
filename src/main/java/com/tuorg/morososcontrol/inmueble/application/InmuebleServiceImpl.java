package com.tuorg.morososcontrol.inmueble.application;

import com.tuorg.morososcontrol.grupo.domain.Grupo;
import com.tuorg.morososcontrol.grupo.infrastructure.GrupoRepository;
import com.tuorg.morososcontrol.inmueble.api.dto.InmuebleCreateRequest;
import com.tuorg.morososcontrol.inmueble.api.dto.InmuebleImportResponse;
import com.tuorg.morososcontrol.inmueble.api.dto.InmuebleResponse;
import com.tuorg.morososcontrol.inmueble.domain.Inmueble;
import com.tuorg.morososcontrol.inmueble.infrastructure.InmuebleRepository;
import com.tuorg.morososcontrol.shared.util.TextNormalizer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class InmuebleServiceImpl implements InmuebleService {

    private final InmuebleRepository inmuebleRepository;
    private final GrupoRepository grupoRepository;
    private final InmuebleExcelParser inmuebleExcelParser;

    public InmuebleServiceImpl(
            InmuebleRepository inmuebleRepository,
            GrupoRepository grupoRepository,
            InmuebleExcelParser inmuebleExcelParser
    ) {
        this.inmuebleRepository = inmuebleRepository;
        this.grupoRepository = grupoRepository;
        this.inmuebleExcelParser = inmuebleExcelParser;
    }

    @Override
    public InmuebleResponse create(InmuebleCreateRequest request) {
        String numeroCuenta = TextNormalizer.normalizeRequired(request.numeroCuenta());
        if (inmuebleRepository.existsByNumeroCuentaIgnoreCase(numeroCuenta)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un inmueble con ese número de cuenta");
        }

        Grupo grupo = grupoRepository.findById(request.grupoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grupo no encontrado"));

        Inmueble inmueble = new Inmueble();
        inmueble.setNumeroCuenta(numeroCuenta);
        inmueble.setPropietarioNombre(TextNormalizer.normalizeRequired(request.propietarioNombre()));
        inmueble.setDistrito(TextNormalizer.normalizeRequired(request.distrito()));
        inmueble.setDireccionCompleta(TextNormalizer.normalizeRequired(request.direccionCompleta()));
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

        String numeroCuenta = TextNormalizer.normalizeRequired(request.numeroCuenta());
        if (inmuebleRepository.existsByNumeroCuentaIgnoreCaseAndIdNot(numeroCuenta, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un inmueble con ese número de cuenta");
        }

        Grupo grupo = grupoRepository.findById(request.grupoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grupo no encontrado"));

        inmueble.setNumeroCuenta(numeroCuenta);
        inmueble.setPropietarioNombre(TextNormalizer.normalizeRequired(request.propietarioNombre()));
        inmueble.setDistrito(TextNormalizer.normalizeRequired(request.distrito()));
        inmueble.setDireccionCompleta(TextNormalizer.normalizeRequired(request.direccionCompleta()));
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

    @Override
    public InmuebleImportResponse importExcel(MultipartFile file) {
        InmuebleExcelParseResult parseResult = inmuebleExcelParser.parse(file);

        int creados = 0;
        int actualizados = 0;
        List<String> errores = new ArrayList<>(parseResult.errores());

        for (InmuebleExcelRowData row : parseResult.rowsValidas()) {
            try {
                Grupo grupo = obtenerOCrearGrupoPorSegmento(row.segmento());
                Inmueble inmueble = inmuebleRepository.findByNumeroCuenta(row.numeroCuenta()).orElseGet(Inmueble::new);
                boolean esNuevo = inmueble.getId() == null;

                inmueble.setNumeroCuenta(row.numeroCuenta());
                inmueble.setPropietarioNombre(row.propietarioNombre());
                inmueble.setDistrito(row.distrito());
                inmueble.setDireccionCompleta(row.direccionCompleta());
                inmueble.setGrupo(grupo);
                inmueble.setActivo(row.activo());
                inmueble.setSeguimientoHabilitado(grupo.isSeguimientoActivo());

                inmuebleRepository.save(inmueble);
                if (esNuevo) {
                    creados++;
                } else {
                    actualizados++;
                }
            } catch (Exception ex) {
                errores.add("Fila " + row.rowNumber() + ": " + ex.getMessage());
            }
        }

        return new InmuebleImportResponse(
                parseResult.totalProcesados(),
                creados,
                actualizados,
                errores.size(),
                errores
        );
    }

    private Grupo obtenerOCrearGrupoPorSegmento(String segmento) {
        return grupoRepository.findByNombre(segmento).orElseGet(() -> {
            Grupo nuevoGrupo = new Grupo();
            nuevoGrupo.setNombre(segmento);
            nuevoGrupo.setSeguimientoActivo(false);
            return grupoRepository.save(nuevoGrupo);
        });
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

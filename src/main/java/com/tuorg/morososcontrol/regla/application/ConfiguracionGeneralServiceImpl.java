package com.tuorg.morososcontrol.regla.application;

import com.tuorg.morososcontrol.regla.api.dto.ConfiguracionGeneralRequest;
import com.tuorg.morososcontrol.regla.api.dto.ConfiguracionGeneralResponse;
import com.tuorg.morososcontrol.regla.domain.ConfiguracionGeneral;
import com.tuorg.morososcontrol.regla.infrastructure.ConfiguracionGeneralRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ConfiguracionGeneralServiceImpl implements ConfiguracionGeneralService {

    private final ConfiguracionGeneralRepository configuracionGeneralRepository;

    public ConfiguracionGeneralServiceImpl(ConfiguracionGeneralRepository configuracionGeneralRepository) {
        this.configuracionGeneralRepository = configuracionGeneralRepository;
    }

    @Override
    public ConfiguracionGeneralResponse create(ConfiguracionGeneralRequest request) {
        if (configuracionGeneralRepository.count() > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe una configuración general; use actualización sobre el registro existente"
            );
        }
        ConfiguracionGeneral configuracion = new ConfiguracionGeneral();
        configuracion.setMinimoCuotasSeguimiento(request.minimoCuotasSeguimiento());
        return toResponse(configuracionGeneralRepository.save(configuracion));
    }

    @Override
    @Transactional(readOnly = true)
    public ConfiguracionGeneralResponse findById(UUID id) {
        ConfiguracionGeneral configuracion = configuracionGeneralRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Configuración general no encontrada"));
        return toResponse(configuracion);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConfiguracionGeneralResponse> findAll() {
        return configuracionGeneralRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public ConfiguracionGeneralResponse update(UUID id, ConfiguracionGeneralRequest request) {
        ConfiguracionGeneral configuracion = configuracionGeneralRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Configuración general no encontrada"));

        configuracion.setMinimoCuotasSeguimiento(request.minimoCuotasSeguimiento());
        return toResponse(configuracionGeneralRepository.save(configuracion));
    }

    @Override
    public void delete(UUID id) {
        if (!configuracionGeneralRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Configuración general no encontrada");
        }
        configuracionGeneralRepository.deleteById(id);
    }

    private ConfiguracionGeneralResponse toResponse(ConfiguracionGeneral configuracion) {
        return new ConfiguracionGeneralResponse(
                configuracion.getId(),
                configuracion.getMinimoCuotasSeguimiento()
        );
    }
}

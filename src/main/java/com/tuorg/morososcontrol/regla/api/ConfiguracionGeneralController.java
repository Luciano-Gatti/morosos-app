package com.tuorg.morososcontrol.regla.api;

import com.tuorg.morososcontrol.regla.api.dto.ConfiguracionGeneralRequest;
import com.tuorg.morososcontrol.regla.api.dto.ConfiguracionGeneralResponse;
import com.tuorg.morososcontrol.regla.application.ConfiguracionGeneralService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/configuraciones-generales")
public class ConfiguracionGeneralController {

    private final ConfiguracionGeneralService configuracionGeneralService;

    public ConfiguracionGeneralController(ConfiguracionGeneralService configuracionGeneralService) {
        this.configuracionGeneralService = configuracionGeneralService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConfiguracionGeneralResponse create(@Valid @RequestBody ConfiguracionGeneralRequest request) {
        return configuracionGeneralService.create(request);
    }

    @GetMapping("/{id}")
    public ConfiguracionGeneralResponse findById(@PathVariable UUID id) {
        return configuracionGeneralService.findById(id);
    }

    @GetMapping
    public List<ConfiguracionGeneralResponse> findAll() {
        return configuracionGeneralService.findAll();
    }

    @PutMapping("/{id}")
    public ConfiguracionGeneralResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody ConfiguracionGeneralRequest request
    ) {
        return configuracionGeneralService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        configuracionGeneralService.delete(id);
    }
}

package com.tuorg.morososcontrol.regla.application;

import com.tuorg.morososcontrol.regla.api.dto.ConfiguracionGeneralRequest;
import com.tuorg.morososcontrol.regla.api.dto.ConfiguracionGeneralResponse;

import java.util.List;
import java.util.UUID;

public interface ConfiguracionGeneralService {

    ConfiguracionGeneralResponse create(ConfiguracionGeneralRequest request);

    ConfiguracionGeneralResponse findById(UUID id);

    List<ConfiguracionGeneralResponse> findAll();

    ConfiguracionGeneralResponse update(UUID id, ConfiguracionGeneralRequest request);

    void delete(UUID id);
}

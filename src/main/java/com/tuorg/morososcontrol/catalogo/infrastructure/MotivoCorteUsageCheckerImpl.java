package com.tuorg.morososcontrol.catalogo.infrastructure;

import com.tuorg.morososcontrol.catalogo.application.MotivoCorteUsageChecker;
import com.tuorg.morososcontrol.seguimiento.infrastructure.RegistroCorteRepository;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class MotivoCorteUsageCheckerImpl implements MotivoCorteUsageChecker {

    private final RegistroCorteRepository registroCorteRepository;

    public MotivoCorteUsageCheckerImpl(RegistroCorteRepository registroCorteRepository) {
        this.registroCorteRepository = registroCorteRepository;
    }

    @Override
    public boolean isUsed(UUID motivoCorteId) {
        return registroCorteRepository.existsByMotivoCorteId(motivoCorteId);
    }
}

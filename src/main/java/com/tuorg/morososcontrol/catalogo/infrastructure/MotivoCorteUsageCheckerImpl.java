package com.tuorg.morososcontrol.catalogo.infrastructure;

import com.tuorg.morososcontrol.catalogo.application.MotivoCorteUsageChecker;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class MotivoCorteUsageCheckerImpl implements MotivoCorteUsageChecker {

    @Override
    public boolean isUsed(UUID motivoCorteId) {
        // Punto de extensión para integrar con RegistroCorteRepository en la próxima iteración.
        return false;
    }
}

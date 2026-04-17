package com.tuorg.morososcontrol.catalogo.application;

import java.util.UUID;

public interface MotivoCorteUsageChecker {

    boolean isUsed(UUID motivoCorteId);
}

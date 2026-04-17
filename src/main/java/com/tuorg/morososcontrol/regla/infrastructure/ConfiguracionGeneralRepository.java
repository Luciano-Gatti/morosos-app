package com.tuorg.morososcontrol.regla.infrastructure;

import com.tuorg.morososcontrol.regla.domain.ConfiguracionGeneral;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ConfiguracionGeneralRepository extends JpaRepository<ConfiguracionGeneral, UUID> {
}

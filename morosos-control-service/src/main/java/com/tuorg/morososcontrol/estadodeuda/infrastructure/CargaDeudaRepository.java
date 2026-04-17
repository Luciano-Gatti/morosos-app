package com.tuorg.morososcontrol.estadodeuda.infrastructure;

import com.tuorg.morososcontrol.estadodeuda.domain.CargaDeuda;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CargaDeudaRepository extends JpaRepository<CargaDeuda, UUID> {
}

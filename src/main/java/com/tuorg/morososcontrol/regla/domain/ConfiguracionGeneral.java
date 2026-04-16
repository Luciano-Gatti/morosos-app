package com.tuorg.morososcontrol.regla.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "configuracion_general")
public class ConfiguracionGeneral {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "minimo_cuotas_seguimiento", nullable = false)
    private Integer minimoCuotasSeguimiento;

    public UUID getId() {
        return id;
    }

    public Integer getMinimoCuotasSeguimiento() {
        return minimoCuotasSeguimiento;
    }

    public void setMinimoCuotasSeguimiento(Integer minimoCuotasSeguimiento) {
        this.minimoCuotasSeguimiento = minimoCuotasSeguimiento;
    }
}

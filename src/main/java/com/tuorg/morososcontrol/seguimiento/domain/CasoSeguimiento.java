package com.tuorg.morososcontrol.seguimiento.domain;

import com.tuorg.morososcontrol.inmueble.domain.Inmueble;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "casos_seguimiento")
public class CasoSeguimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inmueble_id", nullable = false)
    private Inmueble inmueble;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_seguimiento", nullable = false)
    private EstadoSeguimiento estadoSeguimiento;

    @Enumerated(EnumType.STRING)
    @Column(name = "etapa_actual", nullable = false)
    private EtapaSeguimiento etapaActual;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Column(name = "motivo_cierre")
    private String motivoCierre;

    public UUID getId() {
        return id;
    }

    public Inmueble getInmueble() {
        return inmueble;
    }

    public void setInmueble(Inmueble inmueble) {
        this.inmueble = inmueble;
    }

    public EstadoSeguimiento getEstadoSeguimiento() {
        return estadoSeguimiento;
    }

    public void setEstadoSeguimiento(EstadoSeguimiento estadoSeguimiento) {
        this.estadoSeguimiento = estadoSeguimiento;
    }

    public EtapaSeguimiento getEtapaActual() {
        return etapaActual;
    }

    public void setEtapaActual(EtapaSeguimiento etapaActual) {
        this.etapaActual = etapaActual;
    }

    public LocalDateTime getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDateTime fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDateTime getFechaCierre() {
        return fechaCierre;
    }

    public void setFechaCierre(LocalDateTime fechaCierre) {
        this.fechaCierre = fechaCierre;
    }

    public String getMotivoCierre() {
        return motivoCierre;
    }

    public void setMotivoCierre(String motivoCierre) {
        this.motivoCierre = motivoCierre;
    }
}

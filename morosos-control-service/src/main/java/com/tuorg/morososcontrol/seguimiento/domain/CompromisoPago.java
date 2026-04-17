package com.tuorg.morososcontrol.seguimiento.domain;

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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "compromisos_pago")
public class CompromisoPago {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "caso_seguimiento_id", nullable = false)
    private CasoSeguimiento casoSeguimiento;

    @Column(name = "fecha_desde", nullable = false)
    private LocalDate fechaDesde;

    @Column(name = "fecha_hasta")
    private LocalDate fechaHasta;

    @Column(name = "observacion")
    private String observacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_compromiso", nullable = false)
    private EstadoCompromiso estadoCompromiso;

    public UUID getId() {
        return id;
    }

    public CasoSeguimiento getCasoSeguimiento() {
        return casoSeguimiento;
    }

    public void setCasoSeguimiento(CasoSeguimiento casoSeguimiento) {
        this.casoSeguimiento = casoSeguimiento;
    }

    public LocalDate getFechaDesde() {
        return fechaDesde;
    }

    public void setFechaDesde(LocalDate fechaDesde) {
        this.fechaDesde = fechaDesde;
    }

    public LocalDate getFechaHasta() {
        return fechaHasta;
    }

    public void setFechaHasta(LocalDate fechaHasta) {
        this.fechaHasta = fechaHasta;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public EstadoCompromiso getEstadoCompromiso() {
        return estadoCompromiso;
    }

    public void setEstadoCompromiso(EstadoCompromiso estadoCompromiso) {
        this.estadoCompromiso = estadoCompromiso;
    }
}

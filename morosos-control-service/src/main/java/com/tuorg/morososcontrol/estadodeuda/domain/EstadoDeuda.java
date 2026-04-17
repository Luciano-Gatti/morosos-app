package com.tuorg.morososcontrol.estadodeuda.domain;

import com.tuorg.morososcontrol.inmueble.domain.Inmueble;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "estados_deuda",
        uniqueConstraints = @UniqueConstraint(name = "uk_estado_deuda_inmueble", columnNames = "inmueble_id")
)
public class EstadoDeuda {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inmueble_id", nullable = false)
    private Inmueble inmueble;

    @Column(name = "cuotas_adeudadas", nullable = false)
    private Integer cuotasAdeudadas;

    @Column(name = "monto_adeudado", nullable = false, precision = 15, scale = 2)
    private BigDecimal montoAdeudado;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    public UUID getId() {
        return id;
    }

    public Inmueble getInmueble() {
        return inmueble;
    }

    public void setInmueble(Inmueble inmueble) {
        this.inmueble = inmueble;
    }

    public Integer getCuotasAdeudadas() {
        return cuotasAdeudadas;
    }

    public void setCuotasAdeudadas(Integer cuotasAdeudadas) {
        this.cuotasAdeudadas = cuotasAdeudadas;
    }

    public BigDecimal getMontoAdeudado() {
        return montoAdeudado;
    }

    public void setMontoAdeudado(BigDecimal montoAdeudado) {
        this.montoAdeudado = montoAdeudado;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }
}

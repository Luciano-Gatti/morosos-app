package pe.morosos.importacion.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import pe.morosos.common.entity.BaseEntity;

@Getter @Setter @Entity @Table(name="importacion_inmueble")
public class ImportacionInmueble extends BaseEntity {
 @Column(name="archivo_nombre", length=255) private String archivoNombre;
 @Column(name="total_registros", nullable=false) private Integer totalRegistros;
 @Column(name="procesados", nullable=false) private Integer procesados;
 @Column(name="creados", nullable=false) private Integer creados;
 @Column(name="actualizados", nullable=false) private Integer actualizados;
 @Column(name="errores", nullable=false) private Integer errores;
 @Enumerated(EnumType.STRING) @Column(name="estado", nullable=false, length=30) private ImportacionEstado estado;
}

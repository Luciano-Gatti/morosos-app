package pe.morosos.seguimiento.dto;
import java.math.BigDecimal;import java.time.LocalDate;import java.util.UUID;
public record HistorialCompromisoResponse(UUID compromisoId,UUID casoId,LocalDate fechaDesde,LocalDate fechaHasta,BigDecimal montoComprometido,String estado,String observacion) {}

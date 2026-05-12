package pe.morosos.deuda.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pe.morosos.audit.service.AuditService;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.deuda.dto.CargaDeudaResponse;
import pe.morosos.deuda.entity.CargaDeuda;
import pe.morosos.deuda.entity.CargaDeudaDetalle;
import pe.morosos.deuda.entity.CargaDeudaError;
import pe.morosos.deuda.entity.CargaDeudaEstado;
import pe.morosos.deuda.mapper.CargaDeudaMapper;
import pe.morosos.deuda.repository.CargaDeudaDetalleRepository;
import pe.morosos.deuda.repository.CargaDeudaErrorRepository;
import pe.morosos.deuda.repository.CargaDeudaRepository;
import pe.morosos.importacion.parser.CsvRowParser;
import pe.morosos.importacion.parser.ExcelRowParser;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.inmueble.repository.InmuebleRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImportacionDeudaService {
  private static final String KEY_CUENTA = "cuenta";
  private static final String KEY_CUOTAS = "cuotas_vencidas";
  private static final String KEY_MONTO = "monto_vencido";

  private final CargaDeudaRepository cargaRepo;
  private final CargaDeudaDetalleRepository detRepo;
  private final CargaDeudaErrorRepository errRepo;
  private final InmuebleRepository inmuebleRepo;
  private final CsvRowParser csvParser;
  private final ExcelRowParser excelParser;
  private final CargaDeudaMapper mapper;
  private final ObjectMapper objectMapper;
  private final AuditService auditService;

  @Transactional
  public CargaDeudaResponse importar(LocalDate periodo, MultipartFile file) {
    String fileName = file != null ? file.getOriginalFilename() : null;
    String extension = extensionOf(fileName);
    if (periodo.getDayOfMonth() != 1) throw new BusinessRuleException("El período debe corresponder al primer día del mes");

    CargaDeuda carga = new CargaDeuda();
    carga.setPeriodo(periodo);
    carga.setEstado(CargaDeudaEstado.PROCESANDO);
    carga.setArchivoNombre(fileName);
    carga.setTotalRegistros(0);
    carga.setProcesados(0);
    carga.setErrores(0);
    carga.setMontoTotal(BigDecimal.ZERO);
    carga = cargaRepo.save(carga);

    auditService.log("CARGA_DEUDA", carga.getId(), "INICIO_IMPORTACION", null, null, "/api/v1/deuda/cargas", null, null);

    List<String> requiredHeaders = List.of(KEY_CUENTA, KEY_CUOTAS, KEY_MONTO);
    List<Map<String, String>> rows = switch (extension) {
      case "csv" -> csvParser.parse(file, requiredHeaders);
      case "xlsx", "xls" -> excelParser.parse(file, requiredHeaders);
      default -> throw new BusinessRuleException("Formato inválido. Extensión no soportada: " + extension + ". Use .csv, .xlsx o .xls");
    };

    log.info("Mapeo final de encabezados deuda: cuenta='{}', cuotas='{}', monto='{}'", KEY_CUENTA, KEY_CUOTAS, KEY_MONTO);

    carga.setTotalRegistros(rows.size());
    Set<String> seen = new HashSet<>();
    int fila = 1;
    BigDecimal total = BigDecimal.ZERO;

    for (Map<String, String> row : rows) {
      fila++;
      String cuenta = valorRequerido(row, KEY_CUENTA, "cuenta").trim();
      try {
        if (cuenta.isBlank()) throw new ImportacionFilaException("La cuenta es obligatoria");
        if (!seen.add(cuenta.toLowerCase(Locale.ROOT))) throw new ImportacionFilaException("Cuenta duplicada en archivo");

        String cuotasRaw = valorRequerido(row, KEY_CUOTAS, "cuotas adeudadas");
        String montoRaw = valorRequerido(row, KEY_MONTO, "monto adeudado");
        int cuotas = parseEnteroOpcional(cuotasRaw, "cuotas adeudadas");
        BigDecimal monto = parseMontoOpcional(montoRaw, "monto adeudado");

        if (fila <= 11) {
          log.info("Fila {} deuda: cuenta='{}', cuotasRaw='{}', montoRaw='{}', cuotasParseadas={}, montoParseado={}", fila, cuenta, cuotasRaw, montoRaw, cuotas, monto);
        }

        Inmueble inmueble = inmuebleRepo.findByCuentaIgnoreCase(cuenta)
            .orElseThrow(() -> new ImportacionFilaException("No existe un inmueble registrado con la cuenta: " + cuenta));

        CargaDeudaDetalle detalle = new CargaDeudaDetalle();
        detalle.setCargaDeuda(carga);
        detalle.setInmueble(inmueble);
        detalle.setCuotasVencidas(cuotas);
        detalle.setMontoVencido(monto);
        detRepo.save(detalle);

        carga.setProcesados(carga.getProcesados() + 1);
        total = total.add(monto);
      } catch (ImportacionFilaException ex) {
        guardarErrorFila(carga, fila, cuenta, row, ex.getMessage());
      } catch (Exception ex) {
        guardarErrorFila(carga, fila, cuenta, row, "Error inesperado al procesar la fila: " + ex.getMessage());
      }
    }

    carga.setMontoTotal(total);
    carga.setEstado(carga.getProcesados() == 0
        ? CargaDeudaEstado.FALLIDA
        : (carga.getErrores() > 0 ? CargaDeudaEstado.COMPLETADA_CON_ERRORES : CargaDeudaEstado.COMPLETADA));
    carga = cargaRepo.save(carga);

    auditService.log("CARGA_DEUDA", carga.getId(), "FIN_IMPORTACION", null, null, "/api/v1/deuda/cargas", null,
        objectMapper.valueToTree(Map.of("procesados", carga.getProcesados(), "errores", carga.getErrores(), "estado", carga.getEstado().name())));
    return mapper.toResponse(carga);
  }

  private void guardarErrorFila(CargaDeuda carga, int fila, String cuenta, Map<String, String> row, String motivo) {
    String descripcion = (motivo == null || motivo.isBlank())
        ? "Error inesperado al procesar la fila: sin detalle adicional"
        : motivo;
    log.warn("Error de validación en fila {} de importación deuda: {}", fila, descripcion);
    CargaDeudaError error = new CargaDeudaError();
    error.setCargaDeuda(carga);
    error.setFila(fila);
    error.setCuenta(cuenta == null || cuenta.isBlank() ? null : cuenta);
    error.setMotivo(descripcion);
    error.setPayload(objectMapper.valueToTree(row));
    errRepo.save(error);
    carga.setErrores(carga.getErrores() + 1);
  }

  private String valorRequerido(Map<String, String> row, String key, String label) {
    if (!row.containsKey(key)) throw new BusinessRuleException("Falta la columna requerida: " + label);
    return row.get(key);
  }

  private int parseEnteroOpcional(String valor, String campo) {
    if (valor == null || valor.trim().isEmpty()) return 0;
    try {
      return Integer.parseInt(valor.trim());
    } catch (NumberFormatException ex) {
      throw new ImportacionFilaException("El campo " + campo + " debe ser un número entero válido. Valor recibido: '" + valor + "'");
    }
  }

  private BigDecimal parseMontoOpcional(String valor, String campo) {
    if (valor == null || valor.trim().isEmpty()) return BigDecimal.ZERO;
    String raw = valor.trim().replace(" ", "");
    String normalized;
    if (raw.contains(",") && raw.contains(".")) {
      normalized = raw.lastIndexOf(',') > raw.lastIndexOf('.') ? raw.replace(".", "").replace(',', '.') : raw.replace(",", "");
    } else if (raw.contains(",")) {
      normalized = raw.replace(".", "").replace(',', '.');
    } else {
      normalized = raw.replace(",", "");
    }
    try {
      return new BigDecimal(normalized);
    } catch (NumberFormatException ex) {
      throw new ImportacionFilaException("El campo " + campo + " debe ser un monto válido. Valor recibido: '" + valor + "'");
    }
  }

  private String extensionOf(String fileName) {
    if (fileName == null || fileName.isBlank()) return "";
    int idx = fileName.lastIndexOf('.');
    if (idx < 0 || idx == fileName.length() - 1) return "";
    return fileName.substring(idx + 1).trim().toLowerCase(Locale.ROOT);
  }

  private static class ImportacionFilaException extends RuntimeException {
    ImportacionFilaException(String message) {
      super(message);
    }
  }
}

package com.tuorg.morososcontrol.estadodeuda.application;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class EstadoDeudaExcelParser {

    private static final String HEADER_CUENTA = "cuenta";
    private static final String HEADER_FACTURAS_ADEUDADAS = "facturas adeudadas";
    private static final String HEADER_CUOTAS_ADEUDADAS = "cuotas adeudadas";
    private static final String HEADER_MONTO_ADEUDADO = "monto adeudado";
    private static final String HEADER_FECHA_ACTUALIZACION = "fecha de actualizacion";

    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("d/M/uuuu"),
            DateTimeFormatter.ofPattern("d-M-uuuu"),
            DateTimeFormatter.ofPattern("uuuu-M-d")
    );

    public EstadoDeudaExcelParseResult parse(MultipartFile file) {
        validarArchivo(file);

        DataFormatter formatter = new DataFormatter();
        List<EstadoDeudaExcelRowData> rowsValidas = new ArrayList<>();
        List<String> errores = new ArrayList<>();
        int totalProcesados = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El Excel no contiene encabezados");
            }

            Map<String, Integer> headers = mapHeaders(headerRow, formatter);
            validarHeaders(headers);

            Integer indiceCuenta = headers.get(HEADER_CUENTA);
            Integer indiceMonto = headers.get(HEADER_MONTO_ADEUDADO);
            Integer indiceFecha = headers.get(HEADER_FECHA_ACTUALIZACION);
            Integer indiceCuotas = headers.get(HEADER_FACTURAS_ADEUDADAS);
            if (indiceCuotas == null) {
                indiceCuotas = headers.get(HEADER_CUOTAS_ADEUDADAS);
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row, formatter)) {
                    continue;
                }

                totalProcesados++;

                try {
                    String numeroCuenta = obtenerValorRequerido(row, indiceCuenta, formatter, "Cuenta");
                    Integer cuotasAdeudadas = parseCuotas(row, indiceCuotas, formatter);
                    BigDecimal montoAdeudado = parseMonto(row, indiceMonto, formatter);
                    LocalDateTime fechaActualizacion = parseFechaActualizacion(row, indiceFecha, formatter);

                    rowsValidas.add(new EstadoDeudaExcelRowData(
                            i + 1,
                            numeroCuenta,
                            cuotasAdeudadas,
                            montoAdeudado,
                            fechaActualizacion
                    ));
                } catch (IllegalArgumentException ex) {
                    errores.add("Fila " + (i + 1) + ": " + ex.getMessage());
                }
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el archivo Excel");
        }

        return new EstadoDeudaExcelParseResult(totalProcesados, rowsValidas, errores);
    }

    private void validarArchivo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe enviar un archivo Excel no vacío");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo debe tener extensión .xlsx");
        }
    }

    private Map<String, Integer> mapHeaders(Row headerRow, DataFormatter formatter) {
        Map<String, Integer> headers = new HashMap<>();
        short lastCellNum = headerRow.getLastCellNum();

        for (int c = 0; c < lastCellNum; c++) {
            Cell cell = headerRow.getCell(c);
            String value = normalize(formatter.formatCellValue(cell));
            if (!value.isBlank()) {
                headers.put(value, c);
            }
        }

        return headers;
    }

    private void validarHeaders(Map<String, Integer> headers) {
        if (!headers.containsKey(HEADER_CUENTA)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falta columna obligatoria en Excel: cuenta");
        }
        if (!headers.containsKey(HEADER_FACTURAS_ADEUDADAS) && !headers.containsKey(HEADER_CUOTAS_ADEUDADAS)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Falta columna obligatoria en Excel: facturas adeudadas o cuotas adeudadas"
            );
        }
        if (!headers.containsKey(HEADER_MONTO_ADEUDADO)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falta columna obligatoria en Excel: monto adeudado");
        }
    }

    private String obtenerValorRequerido(Row row, Integer cellIndex, DataFormatter formatter, String columna) {
        String valor = formatter.formatCellValue(row.getCell(cellIndex)).trim();
        if (valor.isBlank()) {
            throw new IllegalArgumentException("La columna " + columna + " es obligatoria");
        }
        return valor;
    }

    private Integer parseCuotas(Row row, Integer index, DataFormatter formatter) {
        String value = formatter.formatCellValue(row.getCell(index)).trim();
        if (value.isBlank()) {
            throw new IllegalArgumentException("La columna Facturas/Cuotas adeudadas es obligatoria");
        }

        try {
            int cuotas = Integer.parseInt(value.replace(",", ""));
            if (cuotas < 0) {
                throw new IllegalArgumentException("Facturas/Cuotas adeudadas no puede ser negativa");
            }
            return cuotas;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Facturas/Cuotas adeudadas tiene formato inválido: " + value);
        }
    }

    private BigDecimal parseMonto(Row row, Integer index, DataFormatter formatter) {
        String value = formatter.formatCellValue(row.getCell(index)).trim();
        if (value.isBlank()) {
            throw new IllegalArgumentException("La columna Monto adeudado es obligatoria");
        }

        try {
            String normalized = normalizarMonto(value);
            BigDecimal monto = new BigDecimal(normalized);
            if (monto.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Monto adeudado no puede ser negativo");
            }
            return monto;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Monto adeudado tiene formato inválido: " + value);
        }
    }

    private String normalizarMonto(String raw) {
        String value = raw.replace(" ", "");
        int lastComma = value.lastIndexOf(',');
        int lastDot = value.lastIndexOf('.');

        if (lastComma >= 0 && lastDot >= 0) {
            if (lastComma > lastDot) {
                return value.replace(".", "").replace(",", ".");
            }
            return value.replace(",", "");
        }

        if (lastComma >= 0) {
            return value.replace(".", "").replace(",", ".");
        }

        return value;
    }

    private LocalDateTime parseFechaActualizacion(Row row, Integer index, DataFormatter formatter) {
        if (index == null) {
            return null;
        }

        Cell cell = row.getCell(index);
        if (cell == null) {
            return null;
        }

        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        }

        String value = formatter.formatCellValue(cell).trim();
        if (value.isBlank()) {
            return null;
        }

        for (DateTimeFormatter dateFormatter : DATE_FORMATTERS) {
            try {
                LocalDate date = LocalDate.parse(value, dateFormatter);
                return date.atStartOfDay();
            } catch (DateTimeParseException ignored) {
                // se intenta con el próximo formato
            }
        }

        throw new IllegalArgumentException("Fecha de actualización con formato inválido: " + value);
    }

    private boolean isRowEmpty(Row row, DataFormatter formatter) {
        for (Cell cell : row) {
            if (!formatter.formatCellValue(cell).trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private String normalize(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD);
        return normalized
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}

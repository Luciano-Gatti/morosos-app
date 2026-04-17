package com.tuorg.morososcontrol.inmueble.application;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
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
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class InmuebleExcelParser {

    private static final String HEADER_CUENTA = "cuenta";
    private static final String HEADER_PROPIETARIO = "propietario";
    private static final String HEADER_DISTRITO = "distrito";
    private static final String HEADER_DIRECCION = "direccion";
    private static final String HEADER_SEGMENTO = "segmento";
    private static final String HEADER_ACTIVO = "activo";

    public InmuebleExcelParseResult parse(MultipartFile file) {
        validarArchivo(file);

        DataFormatter formatter = new DataFormatter();
        List<InmuebleExcelRowData> rowsValidas = new ArrayList<>();
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

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row, formatter)) {
                    continue;
                }

                totalProcesados++;

                try {
                    String numeroCuenta = obtenerValorRequerido(row, headers.get(HEADER_CUENTA), formatter, "Cuenta");
                    String propietario = obtenerValorRequerido(row, headers.get(HEADER_PROPIETARIO), formatter, "Propietario");
                    String distrito = obtenerValorRequerido(row, headers.get(HEADER_DISTRITO), formatter, "Distrito");
                    String direccion = obtenerValorRequerido(row, headers.get(HEADER_DIRECCION), formatter, "Dirección");
                    String segmento = obtenerValorRequerido(row, headers.get(HEADER_SEGMENTO), formatter, "Segmento");
                    boolean activo = parseActivo(obtenerValorRequerido(row, headers.get(HEADER_ACTIVO), formatter, "Activo"));

                    rowsValidas.add(new InmuebleExcelRowData(
                            i + 1,
                            numeroCuenta,
                            propietario,
                            distrito,
                            direccion,
                            segmento,
                            activo
                    ));
                } catch (IllegalArgumentException ex) {
                    errores.add("Fila " + (i + 1) + ": " + ex.getMessage());
                }
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el archivo Excel");
        }

        return new InmuebleExcelParseResult(totalProcesados, rowsValidas, errores);
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
        List<String> requeridos = List.of(
                HEADER_CUENTA,
                HEADER_PROPIETARIO,
                HEADER_DISTRITO,
                HEADER_DIRECCION,
                HEADER_SEGMENTO,
                HEADER_ACTIVO
        );

        List<String> faltantes = requeridos.stream().filter(h -> !headers.containsKey(h)).toList();
        if (!faltantes.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Faltan columnas obligatorias en Excel: " + String.join(", ", faltantes)
            );
        }
    }

    private String obtenerValorRequerido(Row row, Integer cellIndex, DataFormatter formatter, String columna) {
        String valor = formatter.formatCellValue(row.getCell(cellIndex)).trim();
        if (valor.isBlank()) {
            throw new IllegalArgumentException("La columna " + columna + " es obligatoria");
        }
        return valor;
    }

    private boolean parseActivo(String value) {
        String normalized = normalize(value);
        return switch (normalized) {
            case "true", "1", "si", "s", "activo" -> true;
            case "false", "0", "no", "n", "inactivo" -> false;
            default -> throw new IllegalArgumentException("Valor inválido para Activo: " + value);
        };
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

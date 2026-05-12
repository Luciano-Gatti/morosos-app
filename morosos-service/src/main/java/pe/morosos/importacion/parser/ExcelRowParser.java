package pe.morosos.importacion.parser;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import pe.morosos.common.api.ErrorResponse;
import pe.morosos.common.exception.ValidationException;

@Slf4j
@Component
public class ExcelRowParser {

    public List<Map<String, String>> parse(MultipartFile file, List<String> requiredHeaders) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Archivo vacío", List.of(new ErrorResponse.Detail("file", "Archivo vacío")));
        }

        try (InputStream inputStream = file.getInputStream(); Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new ValidationException("Archivo vacío", List.of(new ErrorResponse.Detail("file", "Archivo vacío")));
            }

            DataFormatter formatter = new DataFormatter();
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new ValidationException("Archivo vacío", List.of(new ErrorResponse.Detail("file", "Archivo vacío")));
            }

            short lastCellNum = headerRow.getLastCellNum();
            int cellCount = Math.max(lastCellNum, (short) 0);
            String[] headers = new String[cellCount];
            for (int i = 0; i < cellCount; i++) {
                headers[i] = formatter.formatCellValue(headerRow.getCell(i));
            }

            CsvRowParser.ParsedHeader parsedHeader = CsvRowParser.buildHeaderIndex(headers, requiredHeaders);
            log.info("Encabezados detectados en Excel: {}", parsedHeader.receivedHeaders());

            List<Map<String, String>> rows = new ArrayList<>();
            int lastRowNum = sheet.getLastRowNum();
            for (int rowNum = 1; rowNum <= lastRowNum; rowNum++) {
                Row rowData = sheet.getRow(rowNum);
                Map<String, String> row = new HashMap<>();
                boolean allBlank = true;
                for (Map.Entry<String, Integer> e : parsedHeader.indexes().entrySet()) {
                    String value = rowData == null ? "" : formatter.formatCellValue(rowData.getCell(e.getValue())).trim();
                    if (!value.isBlank()) allBlank = false;
                    row.put(e.getKey(), value);
                }
                if (!allBlank) {
                    rows.add(row);
                }
            }

            return rows;
        } catch (ValidationException e) {
            throw e;
        } catch (IOException e) {
            throw new ValidationException("Formato inválido", List.of(new ErrorResponse.Detail("file", "No se pudo leer archivo")));
        } catch (Exception e) {
            throw new ValidationException("Formato inválido", List.of(new ErrorResponse.Detail("file", "No se pudo procesar archivo Excel")));
        }
    }
}

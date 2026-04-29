package pe.morosos.importacion.parser;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import pe.morosos.common.exception.ValidationException;
import pe.morosos.common.api.ErrorResponse;

@Component
public class CsvRowParser {

    public List<Map<String, String>> parse(MultipartFile file, List<String> requiredHeaders) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Archivo vacío", List.of(new ErrorResponse.Detail("file", "Archivo vacío")));
        }
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = br.readLine();
            if (headerLine == null) {
                throw new ValidationException("Archivo vacío", List.of(new ErrorResponse.Detail("file", "Archivo vacío")));
            }
            String[] headers = splitCsv(headerLine);
            Map<String, Integer> idx = new HashMap<>();
            for (int i = 0; i < headers.length; i++) idx.put(headers[i].trim().toLowerCase(), i);
            for (String req : requiredHeaders) {
                if (!idx.containsKey(req.toLowerCase())) {
                    throw new ValidationException("Encabezados inválidos", List.of(new ErrorResponse.Detail("header", "Falta columna: " + req)));
                }
            }
            List<Map<String, String>> rows = new ArrayList<>();
            String line;
            while ((line = br.readLine()) != null) {
                String[] cols = splitCsv(line);
                Map<String, String> row = new HashMap<>();
                boolean allBlank = true;
                for (Map.Entry<String, Integer> e : idx.entrySet()) {
                    String v = e.getValue() < cols.length ? cols[e.getValue()].trim() : "";
                    if (!v.isBlank()) allBlank = false;
                    row.put(e.getKey(), v);
                }
                if (!allBlank) rows.add(row);
            }
            return rows;
        } catch (IOException e) {
            throw new ValidationException("Formato inválido", List.of(new ErrorResponse.Detail("file", "No se pudo leer archivo")));
        }
    }

    private String[] splitCsv(String line) { return line.split(",", -1); }
}

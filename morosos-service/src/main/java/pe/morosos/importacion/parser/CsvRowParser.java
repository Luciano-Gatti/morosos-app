package pe.morosos.importacion.parser;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import pe.morosos.common.api.ErrorResponse;
import pe.morosos.common.exception.ValidationException;

@Slf4j
@Component
public class CsvRowParser {

    public static final Map<String, Set<String>> HEADER_ALIASES = Map.of(
            "cuenta", Set.of("cuenta", "n de cuenta", "nro de cuenta", "numero de cuenta", "número de cuenta", "n° de cuenta"),
            "titular", Set.of("titular"),
            "direccion", Set.of("direccion", "dirección", "domicilio"),
            "grupo", Set.of("grupo"),
            "distrito", Set.of("distrito"),
            "cuotas_vencidas", Set.of("cuotas", "cuotas adeudadas", "cantidad de cuotas", "facturas adeudadas", "cantidad facturas", "cuotas vencidas"),
            "monto_vencido", Set.of("monto", "monto adeudado", "deuda", "importe", "importe adeudado", "monto vencido")
    );

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
            ParsedHeader parsedHeader = buildHeaderIndex(headers, requiredHeaders);
            log.info("Encabezados detectados en CSV: {}", parsedHeader.receivedHeaders());

            List<Map<String, String>> rows = new ArrayList<>();
            String line;
            while ((line = br.readLine()) != null) {
                String[] cols = splitCsv(line);
                Map<String, String> row = new HashMap<>();
                boolean allBlank = true;
                for (Map.Entry<String, Integer> e : parsedHeader.indexes().entrySet()) {
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

    public static ParsedHeader buildHeaderIndex(String[] headers, List<String> requiredHeaders) {
        List<String> receivedHeaders = new ArrayList<>();
        Map<String, Integer> idx = new LinkedHashMap<>();
        for (int i = 0; i < headers.length; i++) {
            String original = headers[i] == null ? "" : headers[i];
            receivedHeaders.add(original);
            String normalized = normalizarHeader(original);
            String canonical = toCanonicalHeader(normalized);
            if (canonical != null) {
                idx.putIfAbsent(canonical, i);
            }
        }
        validateRequiredHeaders(requiredHeaders, receivedHeaders, idx);
        return new ParsedHeader(receivedHeaders, idx);
    }

    public static void validateRequiredHeaders(List<String> requiredHeaders, List<String> receivedHeaders, Map<String, Integer> idx) {
        List<String> missing = new ArrayList<>();
        for (String req : requiredHeaders) {
            String canonicalReq = toCanonicalHeader(normalizarHeader(req));
            canonicalReq = canonicalReq != null ? canonicalReq : normalizarHeader(req);
            if (!idx.containsKey(canonicalReq)) {
                missing.add(req);
            }
        }
        if (!missing.isEmpty()) {
            if (missing.size() == 1) {
                throw new ValidationException("Encabezados inválidos", List.of(new ErrorResponse.Detail("header", "Falta la columna requerida: " + missing.get(0))));
            }
            List<String> expectedCanonical = new ArrayList<>();
            for (String req : requiredHeaders) {
                String canonicalReq = toCanonicalHeader(normalizarHeader(req));
                expectedCanonical.add(canonicalReq != null ? canonicalReq : normalizarHeader(req));
            }
            String expected = String.join(", ", expectedCanonical);
            String received = String.join(", ", receivedHeaders);
            String detail = "Faltan columnas: " + String.join(", ", missing)
                    + ". Encabezados esperados: [" + expected + "]"
                    + ". Encabezados recibidos: [" + received + "]";
            throw new ValidationException("Encabezados inválidos", List.of(new ErrorResponse.Detail("header", detail)));
        }
    }

    static String normalizarHeader(String header) {
        if (header == null) return "";
        String normalized = header.trim().toLowerCase();
        normalized = normalized.replaceAll("[°º.]", " ");
        normalized = Normalizer.normalize(normalized, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        normalized = normalized.replaceAll("\\s+", " ").trim();
        return normalized;
    }

    public static String toCanonicalHeader(String normalizedHeader) {
        if (normalizedHeader == null || normalizedHeader.isBlank()) return null;
        for (Map.Entry<String, Set<String>> entry : HEADER_ALIASES.entrySet()) {
            Set<String> normalizedAliases = new LinkedHashSet<>();
            for (String alias : entry.getValue()) normalizedAliases.add(normalizarHeader(alias));
            if (normalizedAliases.contains(normalizedHeader)) return entry.getKey();
        }
        return normalizedHeader;
    }

    private String[] splitCsv(String line) { return line.split(",", -1); }

    public record ParsedHeader(List<String> receivedHeaders, Map<String, Integer> indexes) {}
}

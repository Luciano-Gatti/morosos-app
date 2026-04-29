package pe.morosos.common.util;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsageValidationService {

    private final JdbcTemplate jdbcTemplate;

    public boolean hasRelatedRows(String tableName, String columnName, UUID id) {
        if (!tableExists(tableName)) {
            return false;
        }
        String sql = "SELECT EXISTS (SELECT 1 FROM " + tableName + " WHERE " + columnName + " = ? LIMIT 1)";
        Boolean exists = jdbcTemplate.queryForObject(sql, Boolean.class, id);
        return Boolean.TRUE.equals(exists);
    }

    private boolean tableExists(String tableName) {
        Boolean exists = jdbcTemplate.queryForObject(
                "SELECT to_regclass(?) IS NOT NULL",
                Boolean.class,
                "public." + tableName
        );
        return Boolean.TRUE.equals(exists);
    }
}

package pe.morosos.security;

import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

@Component("reportPermissionEvaluator")
public class ReportPermissionEvaluator {
    private static final Map<String, String> REPORT_PERMISSIONS = Map.of(
            "morosos-grupo-distrito", PermissionCodes.REPORTES_VER_MOROSOS_GRUPO_DISTRITO,
            "estado-inmuebles", PermissionCodes.REPORTES_VER_ESTADO_INMUEBLES,
            "acciones-fechas", PermissionCodes.REPORTES_VER_ACCIONES_FECHAS,
            "historial-movimientos", PermissionCodes.REPORTES_VER_HISTORIAL_MOVIMIENTOS,
            "porcentajes-morosidad", PermissionCodes.REPORTES_VER_PORCENTAJES_MOROSIDAD,
            "acciones-regularizacion", PermissionCodes.REPORTES_VER_ACCIONES_REGULARIZACION
    );

    public boolean canRead(Authentication authentication, String reporteId) {
        if (authentication == null || reporteId == null) {
            return false;
        }
        String requiredPermission = REPORT_PERMISSIONS.get(reporteId);
        if (requiredPermission == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(requiredPermission::equals);
    }
}

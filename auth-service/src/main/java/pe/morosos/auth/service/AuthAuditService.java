package pe.morosos.auth.service;

import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.auth.audit.entity.AuditLog;
import pe.morosos.auth.audit.entity.LoginAttempt;
import pe.morosos.auth.audit.model.LoginAttemptResult;
import pe.morosos.auth.audit.repository.AuditLogRepository;
import pe.morosos.auth.audit.repository.LoginAttemptRepository;
import pe.morosos.auth.common.HttpHeadersConstants;
import pe.morosos.auth.security.AuthPrincipal;
import pe.morosos.auth.user.entity.Usuario;

@Service
public class AuthAuditService {

    private final LoginAttemptRepository loginAttemptRepository;
    private final AuditLogRepository auditLogRepository;

    public AuthAuditService(LoginAttemptRepository loginAttemptRepository, AuditLogRepository auditLogRepository) {
        this.loginAttemptRepository = loginAttemptRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLoginAttempt(Usuario usuario, String usernameOrEmail, LoginAttemptResult result, HttpServletRequest request) {
        LoginAttempt attempt = new LoginAttempt();
        attempt.setUsuario(usuario);
        attempt.setUsernameEmailUsado(trim(usernameOrEmail, 180));
        attempt.setResultado(result);
        attempt.setIp(resolveClientIp(request));
        attempt.setUserAgent(trim(request.getHeader("User-Agent"), 512));
        loginAttemptRepository.save(attempt);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordAuthEvent(String action, Usuario usuario, HttpServletRequest request, String safeJsonValues) {
        AuditLog auditLog = new AuditLog();
        auditLog.setEntityType(usuario == null ? "AUTH" : "USER");
        auditLog.setEntityId(usuario == null ? null : usuario.getId().toString());
        auditLog.setAction(action);
        auditLog.setActorId(resolveActorId(usuario));
        auditLog.setTraceId(MDC.get(HttpHeadersConstants.TRACE_ID_MDC_KEY));
        auditLog.setRequestPath(trim(request == null ? null : request.getRequestURI(), 300));
        auditLog.setOldValues(null);
        auditLog.setNewValues(safeJsonValues);
        auditLogRepository.save(auditLog);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordAuthFailure(Usuario usuario, HttpServletRequest request, String reason) {
        String safeJson = reason == null ? null : "{\"reason\":\"" + escapeJson(reason) + "\"}";
        recordAuthEvent("LOGIN_FAILURE", usuario, request, safeJson);
    }

    @Transactional(readOnly = true)
    public long countRecentFailedAttempts(UUID usuarioId, int lastMinutes) {
        return loginAttemptRepository.countByUsuarioIdAndResultadoSince(
                usuarioId,
                LoginAttemptResult.INVALID_CREDENTIALS,
                OffsetDateTime.now().minusMinutes(lastMinutes)
        );
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return trim(forwardedFor.split(",")[0].trim(), 80);
        }
        return trim(request.getRemoteAddr(), 80);
    }

    private String resolveActorId(Usuario usuario) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthPrincipal principal) {
            return principal.userId().toString();
        }
        return usuario == null ? null : usuario.getId().toString();
    }

    private String trim(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}

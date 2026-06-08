package pe.morosos.auth.session;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import pe.morosos.auth.exception.AuthBusinessException;

@Service
public class RequestThrottleService {

    private final ConcurrentHashMap<String, WindowCounter> counters = new ConcurrentHashMap<>();

    public void enforce(String action, String subject, int limitPerMinute, HttpServletRequest request) {
        String ip = request == null ? "unknown" : firstNonBlank(request.getHeader("X-Forwarded-For"), request.getRemoteAddr());
        String key = action + "|" + (subject == null ? "" : subject.trim().toLowerCase()) + "|" + ip;
        WindowCounter counter = counters.compute(key, (ignored, existing) -> {
            Instant now = Instant.now();
            if (existing == null || existing.expiresAt().isBefore(now)) {
                return new WindowCounter(new AtomicInteger(1), now.plus(Duration.ofMinutes(1)));
            }
            existing.count().incrementAndGet();
            return existing;
        });
        if (counter.count().get() > limitPerMinute) {
            throw new AuthBusinessException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED", "Se excedio el limite temporal para " + action + ".");
        }
    }

    private String firstNonBlank(String left, String right) {
        if (left != null && !left.isBlank()) {
            return left.split(",")[0].trim();
        }
        return right == null ? "unknown" : right;
    }

    private record WindowCounter(AtomicInteger count, Instant expiresAt) {}
}

package pe.morosos.auth.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth-service")
public class HealthController {

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("auth-service", "UP");
    }
}

package pe.morosos.security;

import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class TechnicalActorProvider {

    public static final String TECHNICAL_ACTOR = "SYSTEM_MOROSOS";

    public UUID getActorIdOrNull() {
        return null;
    }

    public String getActorName() {
        return TECHNICAL_ACTOR;
    }
}

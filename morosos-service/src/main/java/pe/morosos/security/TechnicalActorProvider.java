package pe.morosos.security;

import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class TechnicalActorProvider {

    public static final String TECHNICAL_ACTOR = "SYSTEM_MOROSOS";

    private final CurrentUser currentUser;

    public TechnicalActorProvider(CurrentUser currentUser) {
        this.currentUser = currentUser;
    }

    public UUID getActorIdOrNull() {
        return currentUser.userId().orElse(null);
    }

    public String getActorName() {
        return currentUser.username().orElse(TECHNICAL_ACTOR);
    }
}

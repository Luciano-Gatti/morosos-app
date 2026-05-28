package pe.morosos.auth.identity.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.morosos.auth.identity.entity.IdentidadExterna;
import pe.morosos.auth.identity.model.ExternalProvider;

public interface IdentidadExternaRepository extends JpaRepository<IdentidadExterna, UUID> {

    Optional<IdentidadExterna> findByProviderAndProviderSubject(
            ExternalProvider provider,
            String providerSubject
    );
}

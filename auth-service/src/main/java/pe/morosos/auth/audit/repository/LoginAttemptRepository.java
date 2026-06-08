package pe.morosos.auth.audit.repository;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.morosos.auth.audit.entity.LoginAttempt;
import pe.morosos.auth.audit.model.LoginAttemptResult;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, UUID> {

    @Query("""
            select count(attempt)
            from LoginAttempt attempt
            where attempt.usuario.id = :usuarioId
              and attempt.resultado = :resultado
              and attempt.createdAt >= :since
            """)
    long countByUsuarioIdAndResultadoSince(
            @Param("usuarioId") UUID usuarioId,
            @Param("resultado") LoginAttemptResult resultado,
            @Param("since") OffsetDateTime since
    );
}

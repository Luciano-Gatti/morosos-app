package pe.morosos.auth.audit.repository;

import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.morosos.auth.audit.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("""
            select log
            from AuditLog log
            where (:entityType is null or log.entityType = :entityType)
              and (:actorId is null or log.actorId = :actorId)
              and (:action is null or log.action = :action)
              and (:fromDate is null or log.createdAt >= :fromDate)
              and (:toDate is null or log.createdAt <= :toDate)
            order by log.createdAt desc
            """)
    Page<AuditLog> search(
            @Param("entityType") String entityType,
            @Param("actorId") String actorId,
            @Param("action") String action,
            @Param("fromDate") OffsetDateTime fromDate,
            @Param("toDate") OffsetDateTime toDate,
            Pageable pageable
    );
}

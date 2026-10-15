package org.insa.pki.certificatemanagement.certificateManagmentBackend.repository;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditLog;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditRepository extends
        JpaRepository<AuditLog, Long>,
        JpaSpecificationExecutor<AuditLog> {

    AuditLog findTopByOrderByIdDesc();

    List<AuditLog> findByCorrelationIdOrderByTimestampAsc(String correlationId);

    long countByStatus(AuditStatus status);

    long countByActionAndTimestampAfter(
            String action,
            LocalDateTime timestamp
    );

    List<AuditLog> findTop20BySeverityOrderByTimestampDesc(
            org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditSeverity severity
    );
    @Query("""
SELECT a.status, COUNT(a)
FROM AuditLog a
GROUP BY a.status
""")
    List<Object[]> getStatusDistribution();

    @Query("""
SELECT a.eventType, COUNT(a)
FROM AuditLog a
GROUP BY a.eventType
""")
    List<Object[]> getEventTypeDistribution();
    @Query("""
SELECT a.username, COUNT(a)
FROM AuditLog a
GROUP BY a.username
ORDER BY COUNT(a) DESC
""")
    Page<Object[]> getTopUsers(Pageable pageable);

    @Query("""
SELECT a.endpoint, COUNT(a)
FROM AuditLog a
GROUP BY a.endpoint
ORDER BY COUNT(a) DESC
""")
    Page<Object[]> getTopEndpoints(Pageable pageable);
}
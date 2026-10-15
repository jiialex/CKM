package org.insa.pki.certificatemanagement.certificateManagmentBackend.repository;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.BlockedIp;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditSeverity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BlockedIpRepository extends JpaRepository<BlockedIp, Long> {

    Optional<BlockedIp> findByIp(String ip);

    void deleteByExpiresAtBefore(LocalDateTime now);

    List<BlockedIp> findByActiveTrue();

    long countBySeverity(AuditSeverity severity);
}
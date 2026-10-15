package org.insa.pki.certificatemanagement.certificateManagmentBackend.repository;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CertificateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<CertificateEntity, Long> {

    Optional<CertificateEntity> findByAlias(String alias);
    Optional<CertificateEntity> findBySerialNumber(String serialNumber);

    @Query("""
SELECT c FROM CertificateEntity c
WHERE c.expiryDate BETWEEN :now AND :threshold
""")
    List<CertificateEntity> findExpiringCertificates(
            @Param("now") LocalDateTime now,
            @Param("threshold") LocalDateTime threshold
    );
    List<CertificateEntity> findByStatusNot(String status);

    @Query("""
SELECT DISTINCT c FROM CertificateEntity c
WHERE (LOWER(c.createdBy) = LOWER(:username) OR LOWER(c.issuedBy) = LOWER(:username))
AND (c.status IS NULL OR c.status <> :status)
""")
    List<CertificateEntity> findMyCertificates(
            @Param("username") String username,
            @Param("status") String status
    );

    List<CertificateEntity> findByCaTrueAndStatusNot(
            String status
    );
}

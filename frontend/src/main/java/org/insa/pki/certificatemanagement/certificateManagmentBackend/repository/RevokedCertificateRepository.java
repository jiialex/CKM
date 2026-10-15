package org.insa.pki.certificatemanagement.certificateManagmentBackend.repository;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CertificateEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.RevokedCertificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RevokedCertificateRepository extends JpaRepository<RevokedCertificate, Long> {

    List<RevokedCertificate> findByIssuerAlias(String issuerAlias);
    Optional<CertificateEntity> findBySerialNumber(String serialNumber);
   

    List<RevokedCertificate> findByRevokedBy(String revokedBy);
  

}
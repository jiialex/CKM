package org.insa.pki.certificatemanagement.certificateManagmentBackend.repository;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CsrEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CsrStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CsrRepository extends JpaRepository<CsrEntity, Long> {
    List<CsrEntity> findByCreatedBy(String createdBy);
    List<CsrEntity> findAll();
    List<CsrEntity> findByStatusAndCa(CsrStatus status, Boolean ca);
    List<CsrEntity> findByStatus(CsrStatus status);
}
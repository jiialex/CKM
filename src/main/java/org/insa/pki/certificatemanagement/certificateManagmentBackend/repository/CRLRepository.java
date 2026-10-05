package org.insa.pki.certificatemanagement.certificateManagmentBackend.repository;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CRLEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CRLRepository extends JpaRepository<CRLEntryEntity, Long> {

    Optional<CRLEntryEntity> findTopByCaAliasOrderByGeneratedAtDesc(String caAlias);
}
package org.insa.pki.certificatemanagement.certificateManagmentBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.KeyEntity;

import java.util.List;
import java.util.Optional;

public interface KeyRepository extends JpaRepository<KeyEntity, Long> {
    Optional<KeyEntity> findByAlias(String alias);
    List<KeyEntity> findByCreatedBy(String username);

}
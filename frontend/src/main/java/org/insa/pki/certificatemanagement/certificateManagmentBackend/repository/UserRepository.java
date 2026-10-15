package org.insa.pki.certificatemanagement.certificateManagmentBackend.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.UserEntity;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByUsername(String username);
    Optional<UserEntity> findByEmail(String email);
}
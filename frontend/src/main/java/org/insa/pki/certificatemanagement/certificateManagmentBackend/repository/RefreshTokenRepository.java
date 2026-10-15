package org.insa.pki.certificatemanagement.certificateManagmentBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.RefreshToken;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    // ADD THIS LINE to pull active device nodes by username
    List<RefreshToken> findByUsername(String username);
}
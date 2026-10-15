package org.insa.pki.certificatemanagement.certificateManagmentBackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.TokenBlacklist;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TokenBlacklistRepository extends JpaRepository<TokenBlacklist, Long> {

    Optional<TokenBlacklist> findByToken(String token);


    @Modifying
    @Query("DELETE FROM TokenBlacklist t WHERE t.expiry < :now")
    int deleteExpired(@Param("now") long now);
}
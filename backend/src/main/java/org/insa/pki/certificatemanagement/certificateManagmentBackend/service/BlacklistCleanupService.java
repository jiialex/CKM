package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.TokenBlacklistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BlacklistCleanupService {

    private static final Logger log = LoggerFactory.getLogger(BlacklistCleanupService.class);

    private final TokenBlacklistRepository repo;

    public BlacklistCleanupService(TokenBlacklistRepository repo) {
        this.repo = repo;
    }

    @Transactional
    @Scheduled(fixedDelay = 3600000)
    public void cleanup() {

        long start = System.currentTimeMillis();

        try {
            long now = System.currentTimeMillis();

            int deleted = repo.deleteExpired(now);

            long duration = System.currentTimeMillis() - start;

            log.info("🧹 Blacklist cleanup completed | deleted={} | durationMs={}", deleted, duration);

        } catch (Exception e) {

            log.error("❌ Blacklist cleanup failed", e);
        }
    }
}
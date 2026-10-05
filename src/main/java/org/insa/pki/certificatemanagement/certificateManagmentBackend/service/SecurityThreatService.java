package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditContext;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.ThreatEventDto;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.BlockedIp;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.BlockedIpRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class SecurityThreatService {
    private static final String AUTH_FAILURE_SUFFIX = ":AUTH_FAILURE";

    private final BlockedIpRepository blockedIpRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final IpGeoLocationService geoService;
    private final RateLimitService rateLimitService;
    public SecurityThreatService(
            BlockedIpRepository blockedIpRepo,
            SimpMessagingTemplate messagingTemplate,
            IpGeoLocationService geoService,
            RateLimitService rateLimitService
    ) {
        this.blockedIpRepo = blockedIpRepo;
        this.messagingTemplate = messagingTemplate;
        this.geoService = geoService;
        this.rateLimitService = rateLimitService;
    }

    public void registerThreat(
            String ip,
            String reason,
            int attempts
    ) {
        registerThreat(ip, reason, attempts, rateLimitService.getBlockDuration());
    }

    public void registerThreat(
            String ip,
            String reason,
            int attempts,
            java.time.Duration duration
    ) {

        Map<String, String> geo = geoService.lookup(ip);

        String severity = calculateSeverity(attempts);

        Optional<BlockedIp> existing = blockedIpRepo.findByIp(ip);

        BlockedIp blockedIp = existing.orElse(new BlockedIp());

        blockedIp.setIp(ip);
        blockedIp.setReason(reason);
        blockedIp.setAttempts(attempts);
        blockedIp.setSeverity(severity);
        blockedIp.setCountry(geo.get("country"));
        blockedIp.setCity(geo.get("city"));
        blockedIp.setBlockedAt(LocalDateTime.now());
        blockedIp.setExpiresAt(LocalDateTime.now().plus(duration));
        blockedIp.setActive(true);

        blockedIpRepo.save(blockedIp);

        ThreatEventDto dto = new ThreatEventDto(
                blockedIp.getIp(),
                blockedIp.getCountry(),
                blockedIp.getCity(),
                blockedIp.getReason(),
                blockedIp.getSeverity(),
                blockedIp.getAttempts(),
                blockedIp.getBlockedAt()
        );

        messagingTemplate.convertAndSend(
                "/topic/threats",
                dto
        );
    }
    public void analyze(AuditContext ctx) {
        if (ctx == null || ctx.getIp() == null || ctx.getIp().isBlank() || ctx.getStatus() == null) {
            return;
        }

        if (ctx.getStatus() != org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditStatus.FAILED
                && ctx.getStatus() != org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditStatus.BLOCKED) {
            return;
        }

        if (!isAuthenticationThreat(ctx.getAction())) {
            return;
        }

        String key = buildAuthFailureKey(ctx.getIp());
        rateLimitService.loginFailed(key);

        if (rateLimitService.isAllowed(key)) {
            return;
        }

        registerThreat(
                ctx.getIp(),
                ctx.getAction(),
                5
        );
    }
    public void revoke(Long id) {

        BlockedIp ip = blockedIpRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Threat not found"));

        ip.setActive(false);

        blockedIpRepo.save(ip);
        rateLimitService.clearAllForIp(ip.getIp());
    }
    public Map<String, Object> getStats() {

        long total = blockedIpRepo.count();

        long critical = blockedIpRepo.findAll()
                .stream()
                .filter(b -> "CRITICAL".equalsIgnoreCase(b.getSeverity()))
                .count();

        long high = blockedIpRepo.findAll()
                .stream()
                .filter(b -> "HIGH".equalsIgnoreCase(b.getSeverity()))
                .count();

        long medium = blockedIpRepo.findAll()
                .stream()
                .filter(b -> "MEDIUM".equalsIgnoreCase(b.getSeverity()))
                .count();

        return Map.of(
                "total", total,
                "critical", critical,
                "high", high,
                "medium", medium
        );
    }
    public void detectFailedLogin(
            String ip,
            String username
    ) {

        String key = ip + ":" + username;

        rateLimitService.loginFailed(key);

        if (!rateLimitService.isAllowed(key)) {

            registerThreat(
                    ip,
                    "Brute Force Attack",
                    5
            );
        }
    }
    private String calculateSeverity(int attempts) {

        if (attempts >= 1000) return "CRITICAL";

        if (attempts >= 100) return "HIGH";

        return "MEDIUM";
    }

    public boolean isBlocked(String ip) {

        Optional<BlockedIp> blocked = blockedIpRepo.findByIp(ip);

        if (blocked.isEmpty()) {
            return false;
        }

        BlockedIp blockedIp = blocked.get();

        if (!blockedIp.isActive()) {
            return false;
        }

        if (blockedIp.getExpiresAt() != null
                && blockedIp.getExpiresAt().isBefore(LocalDateTime.now())) {

            blockedIp.setActive(false);
            blockedIpRepo.save(blockedIp);
            rateLimitService.clearAllForIp(ip);

            return false;
        }

        return true;
    }

    public List<BlockedIp> getBlockedIps() {

        return blockedIpRepo.findAll()
                .stream()
                .filter(BlockedIp::isActive)
                .toList();
    }

    @Transactional
    @Scheduled(fixedRate = 60000)
    public void cleanup() {

        blockedIpRepo.deleteByExpiresAtBefore(LocalDateTime.now());
    }

    public String buildAuthFailureKey(String ip) {
        return ip + AUTH_FAILURE_SUFFIX;
    }

    public void clearBlock(String ip) {
        if (ip == null || ip.isBlank()) {
            return;
        }

        blockedIpRepo.findByIp(ip).ifPresent(blockedIp -> {
            blockedIp.setActive(false);
            blockedIpRepo.save(blockedIp);
        });

        rateLimitService.clearAllForIp(ip);
    }

    private boolean isAuthenticationThreat(String action) {
        if (action == null) {
            return false;
        }

        String normalizedAction = action.trim().toUpperCase(Locale.ROOT);

        return "MISSING_TOKEN".equals(normalizedAction)
                || "BLACKLISTED_TOKEN".equals(normalizedAction)
                || "INVALID_TOKEN".equals(normalizedAction)
                || "AUTH_ERROR".equals(normalizedAction);
    }
}

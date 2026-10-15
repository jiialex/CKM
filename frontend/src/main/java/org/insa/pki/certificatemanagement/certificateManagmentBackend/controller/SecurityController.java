package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.BlockedIp;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.SecurityThreatService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security")
public class SecurityController {

    private final SecurityThreatService threatService;

    public SecurityController(SecurityThreatService threatService) {
        this.threatService = threatService;
    }

    // =========================
    // GET LIVE THREATS (frontend feed)
    // =========================
    @GetMapping("/alerts")
    public List<BlockedIp> getAlerts() {
        return threatService.getBlockedIps();
    }

    // =========================
    // STATS DASHBOARD
    // =========================
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return threatService.getStats();
    }

    // =========================
    // REVOKE / UNBLOCK IP
    // =========================
    @DeleteMapping("/revoke/{id}")
    public void revoke(@PathVariable Long id) {
        threatService.revoke(id);
    }


    @PostMapping("/block")
    public void block(@RequestBody Map<String, String> body) {
        String ip = body.get("ip");
        String reason = body.getOrDefault("reason", "Manual Block");

        threatService.registerThreat(ip, reason, 0);
    }
}
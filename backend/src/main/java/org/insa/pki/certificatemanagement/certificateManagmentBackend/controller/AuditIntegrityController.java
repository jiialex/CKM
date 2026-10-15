package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.AuditIntegrityService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit/integrity")
public class AuditIntegrityController {

    private AuditIntegrityService service;

    // =========================
    // Constructor Injection
    // =========================

    public AuditIntegrityController(AuditIntegrityService service) {
        this.service = service;
    }

    // =========================
    // API Endpoints
    // =========================

    @GetMapping("/verify")
    public boolean verify() {
        return service.verifyChain();
    }

    // =========================
    // Getter and Setter
    // =========================

    public AuditIntegrityService getService() {
        return service;
    }

    public void setService(AuditIntegrityService service) {
        this.service = service;
    }
}
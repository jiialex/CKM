package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditLog;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.AuditRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditIntegrityService {

    private AuditRepository repo;

    // =========================
    // Constructor Injection
    // =========================

    public AuditIntegrityService(AuditRepository repo) {
        this.repo = repo;
    }


    public boolean verifyChain() {

        List<AuditLog> logs = repo.findAll(Sort.by(Sort.Direction.ASC, "timestamp"));
        for (int i = 1; i < logs.size(); i++) {

            AuditLog current = logs.get(i);
            AuditLog previous = logs.get(i - 1);

            if (!current.getPreviousHash().equals(previous.getCurrentHash())) {
                return false;
            }
        }

        return true;
    }

    // =========================
    // Getter and Setter
    // =========================

    public AuditRepository getRepo() {
        return repo;
    }

    public void setRepo(AuditRepository repo) {
        this.repo = repo;
    }
}
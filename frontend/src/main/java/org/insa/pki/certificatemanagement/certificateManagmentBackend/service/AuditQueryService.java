package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditFilterRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditLog;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.AuditRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.config.AuditSpecification;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class AuditQueryService {

    private static final int MAX_PAGE_SIZE = 500;
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "username",
            "action",
            "target",
            "status",
            "severity",
            "eventType",
            "ip",
            "endpoint",
            "timestamp",
            "httpStatus",
            "executionTimeMs"
    );

    private final AuditRepository repo;

    public AuditQueryService(AuditRepository repo) {
        this.repo = repo;
    }

    public Page<AuditLog> filter(AuditFilterRequest req) {

        return repo.findAll(
                AuditSpecification.filter(normalize(req)),
                pageRequest(req)
        );
    }

    public Optional<AuditLog> findById(Long id) {
        return repo.findById(id);
    }

    public List<AuditLog> latest(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));

        return repo.findAll(
                        PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "timestamp"))
                )
                .getContent();
    }

    public List<AuditLog> exportRows(AuditFilterRequest req) {
        return repo.findAll(
                AuditSpecification.filter(normalize(req)),
                Sort.by(Sort.Direction.DESC, "timestamp")
        );
    }

    private Pageable pageRequest(AuditFilterRequest req) {
        AuditFilterRequest safeReq = normalize(req);
        int page = Math.max(0, safeReq.getPage());
        int size = Math.max(1, Math.min(safeReq.getSize(), MAX_PAGE_SIZE));
        String sortBy = ALLOWED_SORT_FIELDS.contains(safeReq.getSortBy())
                ? safeReq.getSortBy()
                : "timestamp";

        Sort.Direction direction;
        try {
            direction = Sort.Direction.fromString(safeReq.getDirection());
        } catch (IllegalArgumentException ex) {
            direction = Sort.Direction.DESC;
        }

        return PageRequest.of(page, size, Sort.by(direction, sortBy));
    }

    private AuditFilterRequest normalize(AuditFilterRequest req) {
        return req == null ? new AuditFilterRequest() : req;
    }
}

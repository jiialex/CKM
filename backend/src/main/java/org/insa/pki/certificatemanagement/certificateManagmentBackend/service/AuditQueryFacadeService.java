package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditFilterRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

@Service
public class AuditQueryFacadeService {

    private final AuditQueryService queryService;

    public AuditQueryFacadeService(AuditQueryService queryService) {
        this.queryService = queryService;
    }

    public Page<AuditLog> search(AuditFilterRequest req, int page, int size) {

        if (req == null) {
            req = new AuditFilterRequest();
        }

        req.setPage(page);
        req.setSize(size);

        return queryService.filter(req);
    }
}

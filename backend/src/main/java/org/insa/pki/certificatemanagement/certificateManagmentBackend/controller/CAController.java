package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.config.annotation.Auditable;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CertificateTreeNode;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.RootCARequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.SignCsrRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.ca.CAService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ca")
public class CAController {

    private final CAService caService;

    public CAController(CAService caService) {
        this.caService = caService;
    }


    @PreAuthorize("hasRole('CA_OPERATOR')")
    @Auditable(action = "ROOT_CA_CREATE", resource = "CA")
    @PostMapping("/root")
    public ResponseEntity<String> createRootCA(
            @RequestBody RootCARequest request
    ) throws Exception {

        return ResponseEntity.ok(
                caService.generateRootCA(request)
        );
    }

    @PreAuthorize("hasAnyRole('ROOT', 'CA_OPERATOR')")
    @Auditable(action = "INTERMEDIATE_CA_SIGN", resource = "CA")
    @PostMapping("/intermediate/sign")
    public ResponseEntity<String> signIntermediateCA(@RequestBody SignCsrRequest request) throws Exception {

        String pem = caService.signIntermediateCsr(
                request.getCsrId(),
                request.getCaAlias(),
                request.getPin(),
                request.getValidityDays()
        );

        return ResponseEntity.ok(pem);
    }

    // =========================================================
    // CA HIERARCHY
    // =========================================================
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','AUDITOR')")
    @GetMapping("/hierarchy")
    public ResponseEntity<List<CertificateTreeNode>> getHierarchy() {

        return ResponseEntity.ok(
                caService.getCAHierarchy()
        );
    }

    // =========================================================
    // GET ALL CA CERTIFICATES
    // =========================================================
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','AUDITOR')")
    @GetMapping
    public ResponseEntity<List<?>> getAllCAs() {

        return ResponseEntity.ok(
                caService.getAllCACertificates()
        );
    }
}
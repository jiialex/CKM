package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.RevokedCertificateDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.CRLService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crl")
public class CRLController {

    private final CRLService crlService;

    public CRLController(CRLService crlService) {
        this.crlService = crlService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR')")
    @PostMapping("/generate/{caAlias}")
    public ResponseEntity<byte[]> generateCRL(
            @PathVariable String caAlias,
            @RequestParam String pin
    ) throws Exception {

        byte[] crl = crlService.generateCRL(caAlias, pin);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + caAlias + ".crl\"")
                .contentType(MediaType.parseMediaType("application/pkix-crl"))
                .body(crl);
    }
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    @GetMapping("/my-revoked")
    public ResponseEntity<List<RevokedCertificateDTO>>
    getMyRevokedCertificates() {

        return ResponseEntity.ok(
                crlService.getMyRevokedCertificates()
        );
    }
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','AUDITOR')")
    @GetMapping("/revoked")
    public ResponseEntity<List<RevokedCertificateDTO>>
    getRevokedCertificates() {

        return ResponseEntity.ok(
                crlService.getRevokedCertificates()
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','AUDITOR')")
    @GetMapping("/{caAlias}")
    public ResponseEntity<byte[]> getLatestCRL(@PathVariable String caAlias) {

        byte[] crl = crlService.getLatestCRL(caAlias);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + caAlias + ".crl\"")
                .contentType(MediaType.parseMediaType("application/pkix-crl"))
                .body(crl);
    }
}
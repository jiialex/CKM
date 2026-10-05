package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.config.annotation.Auditable;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CertificateDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CertificateNotificationDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.SignCsrRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CertificateEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.CertificateService;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(
            CertificateService certificateService
    ) {
        this.certificateService = certificateService;
    }

    // =========================================================
    // SIGN CSR
    // =========================================================
    @PreAuthorize("hasAnyRole('CA_OPERATOR','USER')")
    @PostMapping("/sign")
    @Auditable(action = "CSR_SIGN")
    public ResponseEntity<String> signCsr(
            @RequestBody SignCsrRequest request
    ) throws Exception {

        return ResponseEntity.ok(
                certificateService.signCsr(request)
        );
    }

    // =========================================================
    // LIST ALL CERTIFICATES
    // =========================================================
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','AUDITOR')")
    @GetMapping
    public ResponseEntity<List<CertificateDTO>> getAllCertificates() {

        return ResponseEntity.ok(
                certificateService.getAllCertificates()
        );
    }

    // =========================================================
    // GET CERTIFICATE BY ID
    // =========================================================
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    @GetMapping("/{id}")
    public ResponseEntity<CertificateDTO> getCertificate(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                certificateService.getCertificateById(id)
        );
    }
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    @PostMapping("/{id}/archive")
    @Auditable(action = "CERTIFICATE_ARCHIVE")
    public ResponseEntity<String> archiveCertificate(@PathVariable Long id) {

        certificateService.archiveCertificate(id);

        return ResponseEntity.ok("Certificate archived successfully");
    }
    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    public ResponseEntity<String> importCert(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String alias
    ) throws Exception {

        return ResponseEntity.ok(
                certificateService.importCertificate(file, alias)
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','AUDITOR')")
    @GetMapping("/notifications/expiring-certificates")
    public ResponseEntity<List<CertificateNotificationDTO>> getNotifications() {

        return ResponseEntity.ok(
                certificateService.getExpiryNotifications()
        );
    }
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    @GetMapping("/my-certificates")
    public ResponseEntity<List<CertificateDTO>> getMyCertificates() {

        return ResponseEntity.ok(
                certificateService.getMyCertificates()
        );
    }

    // =========================================================
    // REVOKED CERTIFICATES
    // =========================================================
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','AUDITOR')")
    @GetMapping("/revoked")
    public ResponseEntity<List<CertificateDTO>> getRevokedCertificates() {

        return ResponseEntity.ok(
                certificateService.getRevokedCertificates()
        );
    }

    // =========================================================
    // EXPIRED CERTIFICATES
    // =========================================================
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','AUDITOR')")
    @GetMapping("/expired")
    public ResponseEntity<List<CertificateDTO>> getExpiredCertificates() {

        return ResponseEntity.ok(
                certificateService.getExpiredCertificates()
        );
    }

    // =========================================================
    // CERTIFICATE CHAIN
    // =========================================================
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    @GetMapping("/{id}/chain")
    public ResponseEntity<List<CertificateDTO>> getCertificateChain(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                certificateService.getCertificateChain(id)
        );
    }

    // =========================================================
    // DOWNLOAD PEM
    // =========================================================
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    @GetMapping("/{id}/pem")
    public ResponseEntity<String> downloadPem(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                certificateService.downloadPem(id)
        );
    }

    // =========================================================
    // DOWNLOAD DER
    // =========================================================
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    @GetMapping("/{id}/der")
    public ResponseEntity<byte[]> downloadDer(
            @PathVariable Long id
    ) throws Exception {

        byte[] der =
                certificateService.downloadDer(id);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=certificate-" + id + ".der"
                )
                .contentType(
                        MediaType.APPLICATION_OCTET_STREAM
                )
                .body(der);
    }


    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    @GetMapping("/{id}/verify")
    public ResponseEntity<Boolean> verifyCertificate(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                certificateService.verifyCertificate(id)
        );
    }

    // =========================================================
    // REVOKE CERTIFICATE
    // =========================================================
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR')")
    @PostMapping("/{id}/revoke")
    @Auditable(action = "CERTIFICATE_REVOKE")
    public ResponseEntity<String> revokeCertificate(
            @PathVariable Long id,
            @RequestParam String reason
    ) {

        certificateService.revokeCertificate(
                id,
                reason
        );

        return ResponseEntity.ok(
                "Certificate revoked successfully"
        );
    }


    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR')")
    @PostMapping("/{id}/renew")
    @Auditable(action = "CERTIFICATE_RENEW")
    public ResponseEntity<String> renewCertificate(
            @PathVariable Long id,
            @RequestParam String caAlias,
            @RequestParam String pin,
            @RequestParam int validityDays
    ) throws Exception {

        return ResponseEntity.ok(
                certificateService.renewCertificate(
                        id,
                        caAlias,
                        pin,
                        validityDays
                )
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','AUDITOR')")
    @GetMapping("/expiring-soon")
    public ResponseEntity<List<CertificateDTO>> getExpiringSoonCertificates() {

        return ResponseEntity.ok(
                certificateService.getExpiringSoonCertificates()
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    @GetMapping("/ca-list")
    public ResponseEntity<List<CertificateEntity>> getCaCertificates() {

        return ResponseEntity.ok(
                certificateService.getCaCertificates()
        );
    }
}
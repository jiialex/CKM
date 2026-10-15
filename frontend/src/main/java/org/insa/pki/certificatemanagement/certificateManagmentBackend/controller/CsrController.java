package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.config.annotation.Auditable;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.ApproveCsrRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CsrRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CsrResponse;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.RejectCsrRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CsrEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.CsrService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/csr")
public class CsrController {

    private final CsrService csrService;

    public CsrController(CsrService csrService) {
        this.csrService = csrService;
    }


    @PreAuthorize("hasAnyRole('USER', 'CA_OPERATOR')") // Fixed syntax
    @PostMapping("/generate")
    @Auditable(action = "CSR_GENERATE")
    public CsrResponse generateCsr(@RequestBody CsrRequest request) throws Exception {
        return csrService.generateCsr(request);
    }
    @PreAuthorize("hasAnyRole('CA_OPERATOR','ADMIN','USER','AUDITOR')")
    @GetMapping("/list")
    public List<CsrEntity> getAllCsrs() {
        return csrService.getAllCsrs();
    }
    @PreAuthorize("hasAnyRole('USER','AUDITOR','CA_OPERATOR')")
    @GetMapping("/my")
    public List<CsrEntity> getMyCsr() {
        return csrService.getMyCsrs();
    }
    @GetMapping("/approved")
    @PreAuthorize("hasAnyRole('CA_OPERATOR', 'ADMIN')")
    public ResponseEntity<List<CsrEntity>> getApprovedCsrs() {
        List<CsrEntity> approved = csrService.getApprovedCsrs();
        return ResponseEntity.ok(approved);
    }

    /**
     * Fetch all rejected CSR records for historical audit logging.
     */
    @GetMapping("/rejected")
    @PreAuthorize("hasAnyRole('CA_OPERATOR', 'ADMIN')")
    public ResponseEntity<List<CsrEntity>> getRejectedCsrs() {
        List<CsrEntity> rejected = csrService.getRejectedCsrs();
        return ResponseEntity.ok(rejected);
    }

    @PreAuthorize("hasAnyRole('USER','AUDITOR','CA_OPERATOR')")
    @GetMapping("/{id}")
    public CsrEntity getCsrById(@PathVariable Long id) {
        return csrService.getCsrById(id);
    }


    @PreAuthorize("hasAnyRole('USER','AUDITOR','CA_OPERATOR')")
    @GetMapping("/export/{id}")
    @Auditable(action = "CSR_EXPORT")
    public byte[] exportCsr(@PathVariable Long id) {
        return csrService.exportCsr(id);
    }


    @PreAuthorize("hasAnyRole('USER','AUDITOR','CA_OPERATOR')")
    @DeleteMapping("/{id}")
    @Auditable(action = "CSR_DELETE")
    public String deleteCsr(@PathVariable Long id) {
        csrService.deleteCsr(id);
        return "CSR deleted successfully";
    }


    @PreAuthorize("hasAnyRole('USER','AUDITOR','CA_OPERATOR')")
    @PostMapping("/import")
    @Auditable(action = "CSR_IMPORT")
    public CsrEntity importCsr(
            @RequestParam String alias,
            @RequestBody String pem
    ) {
        return csrService.importCsr(alias, pem);
    }

    // Now accepts an ApproveCsrRequest body carrying which CA signs
    // this CSR (caAlias) and that CA's HSM PIN (caPin), since approval
    // performs actual X.509 certificate signing, not just a status flip.
    @PreAuthorize("hasAnyRole('CA_OPERATOR','ADMIN')")
    @PostMapping("/{id}/approve")
    @Auditable(action = "CSR_APPROVE")
    public String approveCsr(@PathVariable Long id, @RequestBody ApproveCsrRequest request) throws Exception {

        csrService.approveCsr(id, request.getCaAlias(), request.getCaPin());

        return "CSR approved and certificate issued successfully";
    }

    @PreAuthorize("hasAnyRole('CA_OPERATOR','ADMIN')")
    @PostMapping("/{id}/reject")
    @Auditable(action = "CSR_REJECT")
    public String rejectCsr(
            @PathVariable Long id,
            @RequestBody RejectCsrRequest request
    ) {

        csrService.rejectCsr(id, request.getReason());

        return "CSR rejected successfully";
    }
    @PreAuthorize("hasAnyRole('CA_OPERATOR','ADMIN','AUDITOR')")
    @GetMapping("/pending/end-entity")
    public List<CsrEntity> getPendingEndEntityCsrs() {
        return csrService.getPendingEndEntityCsrs();
    }

    @PreAuthorize("hasAnyRole('CA_OPERATOR','ADMIN','AUDITOR')")
    @GetMapping("/pending/intermediate-ca")
    public List<CsrEntity> getPendingIntermediateCaCsrs() {
        return csrService.getPendingIntermediateCaCsrs();
    }
    @PreAuthorize("hasAnyRole('CA_OPERATOR','ADMIN','AUDITOR')")
    @GetMapping("/pending")
    public List<CsrEntity> getPendingCsrs() {
        return csrService.getPendingCsrs();
    }
    @PreAuthorize("hasAnyRole('CA_OPERATOR','ADMIN')")
    @PostMapping("/{id}/validate")
    public boolean validateCsr(@PathVariable Long id) {
        return csrService.validateCsr(id);
    }
    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{id}/withdraw")
    @Auditable(action = "CSR_WITHDRAW")
    public String withdrawCsr(@PathVariable Long id) {

        csrService.withdrawCsr(id);

        return "CSR withdrawn successfully";
    }
    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadCsr(
            @PathVariable Long id
    ) {

        byte[] content = csrService.exportCsr(id);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=csr-" + id + ".csr"
                )
                .contentType(MediaType.TEXT_PLAIN)
                .body(content);
    }
}
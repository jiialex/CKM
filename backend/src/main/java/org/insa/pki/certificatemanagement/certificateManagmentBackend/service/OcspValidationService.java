package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditContext;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.OcspValidationResponse;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.*;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.CertificateRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.RevokedCertificateRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.security.CertificateUtils;
import org.springframework.stereotype.Service;

import java.security.cert.X509Certificate;
import java.time.LocalDateTime;

@Service
public class OcspValidationService {

    private final CertificateRepository certificateRepository;
    private final RevokedCertificateRepository revokedRepository;
    private final AuditService auditService;

    public OcspValidationService(
            CertificateRepository certificateRepository,
            RevokedCertificateRepository revokedRepository,
            AuditService auditService
    ) {
        this.certificateRepository = certificateRepository;
        this.revokedRepository = revokedRepository;
        this.auditService = auditService;
    }

    /**
     * OCSP-style validation (DB-backed, serial-number based)
     */
    public OcspValidationResponse validateCertificateBySerial(
            String serialNumber,
            String issuerAlias,
            String actor
    ) throws Exception {

        String correlationId = "OCSP-" + System.currentTimeMillis();

        try {

            // 1. Load certificate by SERIAL (OCSP standard)
            CertificateEntity certEntity =
                    certificateRepository.findBySerialNumber(serialNumber)
                            .orElseThrow(() -> new RuntimeException("Certificate not found"));

            // 2. Load issuer (optional validation layer)
            CertificateEntity issuerEntity =
                    certificateRepository.findByAlias(issuerAlias)
                            .orElseThrow(() -> new RuntimeException("Issuer not found"));

            // 3. Optional: parse certificates (kept for future cryptographic validation)
            X509Certificate cert =
                    CertificateUtils.parse(certEntity.getCertificate());

            X509Certificate issuer =
                    CertificateUtils.parse(issuerEntity.getCertificate());

            // 4. REVOCATION CHECK (primary source)
            boolean revoked =
                    revokedRepository.findBySerialNumber(serialNumber).isPresent();

            String status;

            if (revoked || "REVOKED".equalsIgnoreCase(certEntity.getStatus())) {
                status = "REVOKED";

            } else if (certEntity.getExpiryDate() != null &&
                    certEntity.getExpiryDate().isBefore(LocalDateTime.now())) {
                status = "EXPIRED";

            } else {
                status = "GOOD";
            }

            // 5. Extract OCSP URL from certificate (AIA extension)
            String ocspUrl = extractOcspUrl(cert);

            // 6. AUDIT SUCCESS
            AuditContext audit = new AuditContext();
            audit.setUser(actor);
            audit.setAction("OCSP_VALIDATION");
            audit.setTarget(serialNumber);
            audit.setEndpoint("/api/ocsp/validate");
            audit.setStatus(AuditStatus.SUCCESS);
            audit.setCorrelationId(correlationId);

            auditService.log(audit);

            return new OcspValidationResponse(
                    status,
                    ocspUrl != null ? ocspUrl : "N/A"
            );

        } catch (Exception ex) {

            // 7. AUDIT FAILURE
            AuditContext audit = new AuditContext();
            audit.setUser(actor);
            audit.setAction("OCSP_VALIDATION");
            audit.setTarget(serialNumber);
            audit.setEndpoint("/api/ocsp/validate");
            audit.setStatus(AuditStatus.FAILED);
            audit.setCorrelationId(correlationId);
            audit.setDetails(ex.getMessage());

            auditService.log(audit);

            throw ex;
        }
    }

    /**
     * Extract OCSP URL from AIA extension
     */
    private String extractOcspUrl(X509Certificate cert) throws Exception {

        byte[] aiaExt = cert.getExtensionValue(
                org.bouncycastle.asn1.x509.Extension.authorityInfoAccess.getId()
        );

        if (aiaExt == null) return null;

        byte[] octets = org.bouncycastle.asn1.ASN1OctetString
                .getInstance(aiaExt)
                .getOctets();

        org.bouncycastle.asn1.x509.AuthorityInformationAccess aia =
                org.bouncycastle.asn1.x509.AuthorityInformationAccess.getInstance(octets);

        for (org.bouncycastle.asn1.x509.AccessDescription ad : aia.getAccessDescriptions()) {

            if (ad.getAccessMethod()
                    .equals(org.bouncycastle.asn1.x509.AccessDescription.id_ad_ocsp)) {

                return ad.getAccessLocation().getName().toString();
            }
        }

        return null;
    }
}
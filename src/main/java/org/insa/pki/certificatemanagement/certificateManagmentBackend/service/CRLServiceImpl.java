package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.CRLReason;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.CRLNumber;
import org.bouncycastle.cert.X509CRLHolder;
import org.bouncycastle.cert.X509v2CRLBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditContext;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.RevokedCertificateDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.*;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Provider;
import java.security.Security;
import java.security.cert.X509Certificate;
import java.util.Date;
import java.util.Enumeration;
import java.util.List;
import java.util.UUID;

@Service
public class CRLServiceImpl implements CRLService {

    private final CertificateRepository certificateRepository;
    private final RevokedCertificateRepository revokedRepository;
    private final CRLRepository crlRepository;
    private final AuditService auditService;

    public CRLServiceImpl(
            CertificateRepository certificateRepository,
            RevokedCertificateRepository revokedRepository,
            CRLRepository crlRepository,
            AuditService auditService
    ) {
        this.certificateRepository = certificateRepository;
        this.revokedRepository = revokedRepository;
        this.crlRepository = crlRepository;
        this.auditService = auditService;
    }

    // =========================================================
    // GET LATEST CRL
    // =========================================================
    @Override
    public byte[] getLatestCRL(String caAlias) {

        CRLEntryEntity entity = crlRepository
                .findTopByCaAliasOrderByGeneratedAtDesc(caAlias)
                .orElseThrow(() -> new RuntimeException("CRL not found"));

        return entity.getCrlData();
    }

    // =========================================================
    // GET ALL REVOKED CERTS
    // =========================================================
    @Override
    public List<RevokedCertificateDTO> getRevokedCertificates() {

        return revokedRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // =========================================================
    // GET MY REVOKED CERTS
    // =========================================================
    @Override
    public List<RevokedCertificateDTO> getMyRevokedCertificates() {

        String currentUser = getCurrentUser();

        return revokedRepository.findByRevokedBy(currentUser)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // =========================================================
    // CRL GENERATION (IMPROVED)
    // =========================================================
    @Override
    public byte[] generateCRL(String caAlias, String pin) throws Exception {

        String correlationId = UUID.randomUUID().toString();

        try {

            if (caAlias == null || caAlias.isBlank()) {
                throw new RuntimeException("CA alias is required");
            }

            if (pin == null || pin.isBlank()) {
                throw new RuntimeException("HSM PIN is required");
            }

            Provider provider = Security.getProvider("SunPKCS11-SoftHSM");

            if (provider == null) {
                throw new RuntimeException(
                        "SunPKCS11-SoftHSM provider not found"
                );
            }

            System.out.println("Using CA Alias: " + caAlias);

            KeyStore ks = KeyStore.getInstance("PKCS11", provider);
            ks.load(null, pin.toCharArray());

            System.out.println("========== HSM ALIASES ==========");

            Enumeration<String> aliases = ks.aliases();

            while (aliases.hasMoreElements()) {
                String alias = aliases.nextElement();
                System.out.println("HSM Alias -> " + alias);
            }

            PrivateKey caPrivateKey =
                    (PrivateKey) ks.getKey(
                            caAlias,
                            pin.toCharArray()
                    );

            if (caPrivateKey == null) {
                throw new RuntimeException(
                        "Private key not found for alias: " + caAlias
                );
            }

            X509Certificate caCert =
                    (X509Certificate) ks.getCertificate(caAlias);

            if (caCert == null) {
                throw new RuntimeException(
                        "Certificate not found for alias: " + caAlias
                );
            }

            caCert.checkValidity();

            CertificateEntity caEntity =
                    certificateRepository.findByAlias(caAlias)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "CA metadata not found in database: "
                                                    + caAlias
                                    )
                            );

            if (!Boolean.TRUE.equals(caEntity.getCa())) {
                throw new RuntimeException(
                        "Alias is not a CA certificate: " + caAlias
                );
            }

            if (!"ACTIVE".equalsIgnoreCase(caEntity.getStatus())) {
                throw new RuntimeException(
                        "CA certificate is not ACTIVE"
                );
            }

            X500Name issuer =
                    new X500Name(
                            caCert.getSubjectX500Principal().getName()
                    );

            Date thisUpdate = new Date();

            Date nextUpdate = new Date(
                    System.currentTimeMillis()
                            + (7L * 24 * 60 * 60 * 1000)
            );

            X509v2CRLBuilder crlBuilder =
                    new X509v2CRLBuilder(
                            issuer,
                            thisUpdate
                    );

            crlBuilder.setNextUpdate(nextUpdate);

            long crlNumber = System.currentTimeMillis();

            crlBuilder.addExtension(
                    Extension.cRLNumber,
                    false,
                    new CRLNumber(
                            BigInteger.valueOf(crlNumber)
                    )
            );

            List<RevokedCertificate> revokedCertificates =
                    revokedRepository.findByIssuerAlias(caAlias);

            System.out.println(
                    "Revoked certificates found: "
                            + revokedCertificates.size()
            );

            for (RevokedCertificate revoked : revokedCertificates) {

                if (revoked.getSerialNumber() == null) {
                    continue;
                }

                if (revoked.getRevocationDate() == null) {
                    continue;
                }

                BigInteger serial;

                try {
                    serial = new BigInteger(
                            revoked.getSerialNumber()
                    );
                } catch (Exception ex) {

                    System.err.println(
                            "Skipping invalid serial: "
                                    + revoked.getSerialNumber()
                    );

                    continue;
                }

                crlBuilder.addCRLEntry(
                        serial,
                        revoked.getRevocationDate(),
                        mapReason(revoked.getReason())
                );
            }

            String signatureAlgorithm =
                    switch (caPrivateKey.getAlgorithm().toUpperCase()) {
                        case "RSA" -> "SHA256withRSA";
                        case "EC" -> "SHA256withECDSA";
                        default ->
                                throw new RuntimeException(
                                        "Unsupported key algorithm: "
                                                + caPrivateKey.getAlgorithm()
                                );
                    };

            ContentSigner signer =
                    new JcaContentSignerBuilder(signatureAlgorithm)
                            .setProvider(provider)
                            .build(caPrivateKey);

            X509CRLHolder crlHolder =
                    crlBuilder.build(signer);

            byte[] crlBytes =
                    crlHolder.getEncoded();

            CRLEntryEntity crlEntity =
                    new CRLEntryEntity();

            crlEntity.setCaAlias(caAlias);
            crlEntity.setCrlData(crlBytes);
            crlEntity.setGeneratedAt(thisUpdate);
            crlEntity.setGeneratedBy(getCurrentUser());
            crlEntity.setCorrelationId(correlationId);

            crlRepository.save(crlEntity);

            AuditContext audit = new AuditContext();

            audit.setUser(getCurrentUser());
            audit.setAction("CRL_GENERATED");
            audit.setTarget(caAlias);
            audit.setEndpoint("/api/crl/generate/" + caAlias);
            audit.setCorrelationId(correlationId);
            audit.setStatus(AuditStatus.SUCCESS);
            audit.setDetails(
                    "CRL generated successfully"
            );

            auditService.log(audit);

            return crlBytes;

        } catch (Exception ex) {

            ex.printStackTrace();

            AuditContext audit = new AuditContext();

            audit.setUser(getCurrentUser());
            audit.setAction("CRL_GENERATED");
            audit.setTarget(caAlias);
            audit.setEndpoint("/api/crl/generate/" + caAlias);
            audit.setCorrelationId(correlationId);
            audit.setStatus(AuditStatus.FAILED);
            audit.setDetails(ex.getMessage());

            auditService.log(audit);

            throw new RuntimeException(
                    "CRL Generation Failed: "
                            + ex.getMessage(),
                    ex
            );
        }
    }
    // =========================================================
    // MAP REVOCATION REASON → CRLReason
    // =========================================================
    private int mapReason(RevocationReason reason) {

        if (reason == null) return CRLReason.unspecified;

        return switch (reason) {
            case KEY_COMPROMISE -> CRLReason.keyCompromise;
            case CA_COMPROMISE -> CRLReason.cACompromise;
            case AFFILIATION_CHANGED -> CRLReason.affiliationChanged;
            case SUPERSEDED -> CRLReason.superseded;
            case CESSATION_OF_OPERATION -> CRLReason.cessationOfOperation;
            case CERTIFICATE_HOLD -> CRLReason.certificateHold;
            default -> CRLReason.unspecified;
        };
    }

    // =========================================================
    // SERIAL PARSER (IMPROVED SAFETY)
    // =========================================================
    private BigInteger parseSerial(String serial) {
        try {
            return new BigInteger(serial);
        } catch (Exception ex) {
            throw new RuntimeException("Invalid serial format: " + serial);
        }
    }

    // =========================================================
    // SIGNATURE ALGORITHM
    // =========================================================
    private String getSignatureAlgorithm(PrivateKey key) {
        return switch (key.getAlgorithm().toUpperCase()) {
            case "RSA" -> "SHA256withRSA";
            case "EC" -> "SHA256withECDSA";
            default -> throw new RuntimeException("Unsupported algorithm");
        };
    }

    // =========================================================
    // CURRENT USER
    // =========================================================
    private String getCurrentUser() {
        return SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }

    // =========================================================
    // DTO MAPPER (UNCHANGED BUT CLEANED)
    // =========================================================
    private RevokedCertificateDTO mapToDTO(RevokedCertificate revoked) {

        RevokedCertificateDTO dto = new RevokedCertificateDTO();

        dto.setId(revoked.getId());
        dto.setSerialNumber(revoked.getSerialNumber());
        dto.setCertificateAlias(revoked.getCertificateAlias());
        dto.setIssuerAlias(revoked.getIssuerAlias());

        if (revoked.getRevocationDate() != null) {
            dto.setRevocationDate(
                    revoked.getRevocationDate()
                            .toInstant()
                            .atZone(java.time.ZoneId.systemDefault())
                            .toLocalDateTime()
            );
        }

        dto.setReason(
                revoked.getReason() != null
                        ? revoked.getReason().name()
                        : "UNSPECIFIED"
        );

        dto.setStatus("REVOKED");

        try {
            CertificateEntity cert =
                    certificateRepository.findByAlias(revoked.getCertificateAlias())
                            .orElse(null);

            if (cert != null) {
                dto.setCommonName(cert.getCommonName());
            }

        } catch (Exception ignored) {}

        return dto;
    }
}
package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CertificateNotificationDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.*;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;
import org.bouncycastle.openssl.jcajce.JcaPEMWriter;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.pkcs.PKCS10CertificationRequest;
import org.bouncycastle.util.io.pem.PemReader;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditContext;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CertificateDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.SignCsrRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.*;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.CertificateRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.CsrRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.RevokedCertificateRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.ca.CertificateProfileService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.StringReader;
import java.io.StringWriter;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class CertificateServiceImpl implements CertificateService {

    private final CertificateRepository certificateRepository;
    private final CsrRepository csrRepository;
    private final AuditService auditService;
    private final CertificateProfileService profileService;
    private final RevokedCertificateRepository revokedRepository;
    private final NotificationService notificationService;
    public CertificateServiceImpl(
            CertificateRepository certificateRepository,
            CsrRepository csrRepository,
            AuditService auditService,
            CertificateProfileService profileService,
            RevokedCertificateRepository revokedRepository,
            NotificationService notificationService
    ) {
        this.certificateRepository = certificateRepository;
        this.csrRepository = csrRepository;
        this.auditService = auditService;
        this.profileService = profileService;
        this.revokedRepository=revokedRepository;
        this.notificationService = notificationService;
    }
    @Autowired
    private JavaMailSender mailSender;
    // =========================================================
    // SIGN CSR
    // =========================================================
    @Override
    public String signCsr(SignCsrRequest request) throws Exception {


        if (request.getCsrId() == null) {
            throw new RuntimeException("CSR ID is required");
        }

        if (request.getPin() == null || request.getPin().isBlank()) {
            throw new RuntimeException("HSM PIN is required");
        }

        if (request.getCaAlias() == null || request.getCaAlias().isBlank()) {
            throw new RuntimeException("CA alias is required");
        }

        CsrEntity csrEntity = csrRepository.findById(request.getCsrId())
                .orElseThrow(() -> new RuntimeException("CSR not found"));

        if (Boolean.TRUE.equals(csrEntity.getIssued())) {
            throw new RuntimeException("CSR already issued");
        }

        if (csrEntity.getStatus() != CsrStatus.APPROVED) {
            throw new RuntimeException(
                    "Only APPROVED CSR can be signed"
            );
        }

        String csrPem = csrEntity.getCsrPem();


        Provider provider =
                Security.getProvider("SunPKCS11-SoftHSM");

        if (provider == null) {
            throw new RuntimeException(
                    "PKCS11 Provider not found"
            );
        }

        char[] pin = request.getPin().toCharArray();

        KeyStore ks =
                KeyStore.getInstance("PKCS11", provider);

        ks.load(null, pin);


        Key key =
                ks.getKey(
                        request.getCaAlias(),
                        pin
                );

        if (!(key instanceof PrivateKey caPrivateKey)) {
            throw new RuntimeException(
                    "CA private key not found for alias: "
                            + request.getCaAlias()
            );
        }


        X509Certificate caCert =
                (X509Certificate)
                        ks.getCertificate(
                                request.getCaAlias()
                        );

        if (caCert == null) {
            throw new RuntimeException(
                    "CA certificate not found for alias: "
                            + request.getCaAlias()
            );
        }

        // CA must be valid
        caCert.checkValidity();

        CertificateEntity issuer =
                certificateRepository
                        .findByAlias(request.getCaAlias())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Issuer CA not found in database"
                                )
                        );

        if ("REVOKED".equalsIgnoreCase(
                issuer.getStatus()
        )) {
            throw new RuntimeException(
                    "Issuer CA is revoked"
            );
        }

        PemReader reader =
                new PemReader(
                        new StringReader(csrPem)
                );

        PKCS10CertificationRequest csr =
                new PKCS10CertificationRequest(
                        reader.readPemObject().getContent()
                );

        X500Name subject =
                csr.getSubject();

        PublicKey publicKey =
                new JcaPEMKeyConverter()
                        .setProvider("BC")
                        .getPublicKey(
                                csr.getSubjectPublicKeyInfo()
                        );

        Date notBefore = new Date();

        Date notAfter =
                new Date(
                        System.currentTimeMillis()
                                + ((long) request.getValidityDays()
                                * 86400000L)
                );

        BigInteger serial =
                BigInteger.valueOf(
                        System.currentTimeMillis()
                );

        JcaX509v3CertificateBuilder builder =
                new JcaX509v3CertificateBuilder(
                        caCert,
                        serial,
                        notBefore,
                        notAfter,
                        subject,
                        publicKey
                );

        builder.addExtension(
                Extension.basicConstraints,
                true,
                new BasicConstraints(false)
        );

        builder.addExtension(
                Extension.subjectKeyIdentifier,
                false,
                new SubjectKeyIdentifier(
                        publicKey.getEncoded()
                )
        );

        builder.addExtension(
                Extension.authorityKeyIdentifier,
                false,
                new AuthorityKeyIdentifier(
                        caCert.getPublicKey().getEncoded()
                )
        );

        if (csrEntity.getKeyUsages() != null
                && !csrEntity.getKeyUsages().isEmpty()) {

            int usage = 0;

            for (String ku : csrEntity.getKeyUsages()) {

                switch (ku) {

                    case "digitalSignature" ->
                            usage |= KeyUsage.digitalSignature;

                    case "keyEncipherment" ->
                            usage |= KeyUsage.keyEncipherment;

                    case "dataEncipherment" ->
                            usage |= KeyUsage.dataEncipherment;

                    case "keyAgreement" ->
                            usage |= KeyUsage.keyAgreement;

                    case "keyCertSign" ->
                            usage |= KeyUsage.keyCertSign;

                    case "cRLSign" ->
                            usage |= KeyUsage.cRLSign;
                }
            }

            builder.addExtension(
                    Extension.keyUsage,
                    true,
                    new KeyUsage(usage)
            );
        }


        if (csrEntity.getExtendedKeyUsages() != null
                && !csrEntity.getExtendedKeyUsages().isEmpty()) {

            List<KeyPurposeId> eku =
                    new ArrayList<>();

            for (String e :
                    csrEntity.getExtendedKeyUsages()) {

                switch (e) {

                    case "serverAuth" ->
                            eku.add(
                                    KeyPurposeId.id_kp_serverAuth
                            );

                    case "clientAuth" ->
                            eku.add(
                                    KeyPurposeId.id_kp_clientAuth
                            );

                    case "emailProtection" ->
                            eku.add(
                                    KeyPurposeId.id_kp_emailProtection
                            );

                    case "codeSigning" ->
                            eku.add(
                                    KeyPurposeId.id_kp_codeSigning
                            );
                }
            }

            if (!eku.isEmpty()) {

                builder.addExtension(
                        Extension.extendedKeyUsage,
                        false,
                        new ExtendedKeyUsage(
                                eku.toArray(
                                        new KeyPurposeId[0]
                                )
                        )
                );
            }
        }

        ContentSigner signer =
                new JcaContentSignerBuilder(
                        "SHA256withRSA"
                )
                        .setProvider(provider)
                        .build(caPrivateKey);

        X509Certificate issuedCert =
                new JcaX509CertificateConverter()
                        .setProvider("BC")
                        .getCertificate(
                                builder.build(signer)
                        );



        MessageDigest md =
                MessageDigest.getInstance("SHA-256");

        String fingerprint =
                Base64.getEncoder()
                        .encodeToString(
                                md.digest(
                                        issuedCert.getEncoded()
                                )
                        );

        String publicKeyHash =
                Base64.getEncoder()
                        .encodeToString(
                                md.digest(
                                        publicKey.getEncoded()
                                )
                        );


        StringWriter sw =
                new StringWriter();

        try (JcaPEMWriter writer =
                     new JcaPEMWriter(sw)) {

            writer.writeObject(issuedCert);
        }

        String pem = sw.toString();

        CertificateEntity cert = new CertificateEntity();

        cert.setAlias(csrEntity.getCsrAlias());
        cert.setKeyAlias(csrEntity.getKeyAlias());

        cert.setCertificate(pem);

        cert.setType("END_ENTITY");
        cert.setCertificateType("END_ENTITY");

        cert.setStatus("ACTIVE");

        cert.setSerialNumber(
                issuedCert.getSerialNumber().toString()
        );

        cert.setIssuerAlias(
                request.getCaAlias()
        );

        cert.setIssuer(
                issuedCert.getIssuerX500Principal().getName()
        );

        cert.setSubject(
                issuedCert.getSubjectX500Principal().getName()
        );

        cert.setCommonName(
                csrEntity.getCommonName()
        );

        cert.setOrganization(
                csrEntity.getOrganization()
        );

        cert.setOrganizationalUnit(
                csrEntity.getOrganizationalUnit()
        );

        cert.setCountry(
                csrEntity.getCountry()
        );

        cert.setState(
                csrEntity.getState()
        );

        cert.setLocality(
                csrEntity.getLocality()
        );

        cert.setEmail(
                csrEntity.getEmail()
        );

        cert.setSignatureAlgorithm(
                issuedCert.getSigAlgName()
        );

// End user cert MUST NOT be CA
        cert.setCa(false);

        cert.setPathLength(null);

        cert.setFingerprint(
                bytesToHex(
                        MessageDigest.getInstance("SHA-256")
                                .digest(issuedCert.getEncoded())
                )
        );

        cert.setPublicKeyHash(
                bytesToHex(
                        MessageDigest.getInstance("SHA-256")
                                .digest(publicKey.getEncoded())
                )
        );

        cert.setCsrHash(
                bytesToHex(
                        MessageDigest.getInstance("SHA-256")
                                .digest(csrPem.getBytes(StandardCharsets.UTF_8))
                )
        );

        cert.setCorrelationId(
                UUID.randomUUID().toString()
        );

        cert.setCreatedAt(
                LocalDateTime.now()
        );

        cert.setExpiryDate(
                issuedCert.getNotAfter()
                        .toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime()
        );

// OWNER OF CERTIFICATE
        cert.setCreatedBy(
                csrEntity.getCreatedBy()
        );

// WHO SIGNED IT
        cert.setIssuedBy(
                getCurrentUser()
        );

        cert.setKeyUsages(
                csrEntity.getKeyUsages() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(csrEntity.getKeyUsages())
        );

        cert.setExtendedKeyUsages(
                csrEntity.getExtendedKeyUsages() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(csrEntity.getExtendedKeyUsages())
        );

        cert.setDnsNames(
                csrEntity.getDnsNames() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(csrEntity.getDnsNames())
        );

        cert.setIpAddresses(
                csrEntity.getIpAddresses() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(csrEntity.getIpAddresses())
        );

        cert.setCrlUrls(
                csrEntity.getCrlUrls() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(csrEntity.getCrlUrls())
        );

        certificateRepository.save(cert);


        csrEntity.setIssued(true);
        csrEntity.setStatus(CsrStatus.SIGNED);

        csrRepository.save(csrEntity);

        notificationService.notifyCertificateIssued(cert);
        notificationService.notifyCsrSigned(csrEntity);

        AuditContext audit =
                new AuditContext();

        audit.setUser(
                getCurrentUser()
        );

        audit.setAction(
                "SIGN_CERTIFICATE"
        );

        audit.setTarget(
                cert.getAlias()
        );

        audit.setIp("SYSTEM");

        audit.setEndpoint(
                "/api/certificates/sign"
        );

        audit.setCorrelationId(
                UUID.randomUUID().toString()
        );

        audit.setStatus(
                AuditStatus.SUCCESS
        );

        audit.setDetails(
                "CSR signed successfully"
        );

        auditService.log(audit);

        return pem;
    }

    // New helper: Send "Certificate Signed" notification
    private void sendCertificateSignedEmail(String to, CertificateEntity cert) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Your Certificate Has Been Signed Successfully");

            String body = "Dear User,\n\n" +
                    "Your certificate request has been processed.\n\n" +
                    "Certificate Alias: " + cert.getAlias() + "\n" +
                    "Serial Number: " + cert.getSerialNumber() + "\n" +
                    "Expiry Date: " + cert.getExpiryDate() + "\n\n" +
                    "You can now download and use your certificate.\n\n" +
                    "Best regards,\nPKI Certificate Management System";

            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            // Log error but don't fail the signing process
            System.err.println("Failed to send signed notification email: " + e.getMessage());
        }
    }
    @Override
    public CertificateDTO getCertificateById(Long id) {

        CertificateEntity cert = certificateRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Certificate not found")
                );

        AuditContext audit = new AuditContext();

        audit.setUser(getCurrentUser());
        audit.setAction("VIEW_CERTIFICATE");
        audit.setTarget(cert.getAlias());
        audit.setIp("SYSTEM");
        audit.setEndpoint("/api/certificates/" + id);
        audit.setCorrelationId(UUID.randomUUID().toString());
        audit.setStatus(AuditStatus.SUCCESS);
        audit.setDetails("Certificate viewed");

        auditService.log(audit);

        return toDto(cert);
    }
    private String bytesToHex(byte[] bytes) {

        StringBuilder sb = new StringBuilder();

        for (byte b : bytes) {

            sb.append(
                    String.format("%02x", b)
            );
        }

        return sb.toString();
    }
    // =========================================================
    // DOWNLOAD PEM
    // =========================================================
    @Override
    public String downloadPem(Long id) {

        CertificateEntity cert = certificateRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Certificate not found")
                );

        AuditContext audit = new AuditContext();

        audit.setUser(getCurrentUser());
        audit.setAction("DOWNLOAD_PEM");
        audit.setTarget(cert.getAlias());
        audit.setIp("SYSTEM");
        audit.setEndpoint("/api/certificates/" + id + "/pem");
        audit.setCorrelationId(UUID.randomUUID().toString());
        audit.setStatus(AuditStatus.SUCCESS);
        audit.setDetails("Certificate PEM downloaded");

        auditService.log(audit);

        return cert.getCertificate();
    }

    // =========================================================
    // VERIFY CERTIFICATE
    // =========================================================
    @Override
    public boolean verifyCertificate(Long id) {

        CertificateEntity cert = certificateRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Certificate not found")
                );

        boolean valid =
                "ACTIVE".equalsIgnoreCase(cert.getStatus());

        AuditContext audit = new AuditContext();

        audit.setUser(getCurrentUser());
        audit.setAction("VERIFY_CERTIFICATE");
        audit.setTarget(cert.getAlias());
        audit.setIp("SYSTEM");
        audit.setEndpoint("/api/certificates/" + id + "/verify");
        audit.setCorrelationId(UUID.randomUUID().toString());
        audit.setStatus(valid?AuditStatus.SUCCESS:AuditStatus.FAILED);
        audit.setDetails("Certificate verification executed");

        auditService.log(audit);

        return valid;
    }

    // =========================================================
    // REVOKE CERTIFICATE
    // =========================================================
    @Override
    public void revokeCertificate(Long id, String reason) {

        CertificateEntity cert = certificateRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Certificate not found")
                );

        if ("REVOKED".equalsIgnoreCase(cert.getStatus())) {
            throw new RuntimeException("Certificate already revoked");
        }

        RevocationReason revocationReason;

        try {

            revocationReason =
                    RevocationReason.valueOf(
                            reason.toUpperCase()
                    );

        } catch (Exception ex) {

            throw new RuntimeException(
                    "Invalid revocation reason"
            );
        }

        String currentUser = getCurrentUser();

        String correlationId = UUID.randomUUID().toString();

        // =========================================
        // UPDATE CERTIFICATE
        // =========================================

        cert.setStatus("REVOKED");

        cert.setRevocationReason(
                revocationReason.name()
        );

        cert.setRevokedAt(LocalDateTime.now());

        cert.setRevokedBy(currentUser);

        certificateRepository.save(cert);

        // =========================================
        // STORE IN REVOKED TABLE
        // =========================================

        RevokedCertificate revoked =
                new RevokedCertificate();

        revoked.setCertificateAlias(
                cert.getAlias()
        );

        revoked.setIssuerAlias(
                cert.getIssuerAlias()
        );

        revoked.setSerialNumber(
                cert.getSerialNumber()
        );

        revoked.setReason(
                revocationReason
        );

        revoked.setRevocationDate(
                new Date()
        );

        revoked.setRevokedBy(currentUser);

        revoked.setCorrelationId(correlationId);

        revokedRepository.save(revoked);

        notificationService.notifyCertificateRevoked(cert);

        // =========================================
        // AUDIT
        // =========================================

        AuditContext audit = new AuditContext();

        audit.setUser(currentUser);

        audit.setAction("REVOKE_CERTIFICATE");

        audit.setTarget(cert.getAlias());

        audit.setIp("SYSTEM");

        audit.setEndpoint(
                "/api/certificates/" + id + "/revoke"
        );

        audit.setCorrelationId(correlationId);

        audit.setStatus(AuditStatus.SUCCESS);

        audit.setDetails(
                "Certificate revoked. Reason: "
                        + revocationReason.name()
        );

        auditService.log(audit);
    }


    public CertificateDTO toDto(CertificateEntity cert) {

        CertificateDTO dto = new CertificateDTO();

        dto.setId(cert.getId());
        dto.setAlias(cert.getAlias());
        dto.setIssuerAlias(cert.getIssuerAlias());
        dto.setSubject(cert.getSubject());
        dto.setSerialNumber(cert.getSerialNumber());
        dto.setSignatureAlgorithm(cert.getSignatureAlgorithm());
        dto.setType(cert.getType());
        dto.setStatus(cert.getStatus());

        dto.setCreatedAt(cert.getCreatedAt());
        dto.setExpiryDate(cert.getExpiryDate());

        dto.setCertificatePem(cert.getCertificate());

        dto.setValidityPercentage(
                calculateValidityPercentage(
                        cert.getCreatedAt(),
                        cert.getExpiryDate()
                )
        );

        return dto;
    }

    // =========================================================
    // VALIDITY PERCENTAGE
    // =========================================================
    private double calculateValidityPercentage(
            LocalDateTime createdAt,
            LocalDateTime expiryDate
    ) {

        if (createdAt == null || expiryDate == null) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();

        if (now.isBefore(createdAt)) {
            return 0;
        }

        if (now.isAfter(expiryDate)) {
            return 100;
        }

        long totalMillis =
                java.time.Duration
                        .between(createdAt, expiryDate)
                        .toMillis();

        long elapsedMillis =
                java.time.Duration
                        .between(createdAt, now)
                        .toMillis();

        if (totalMillis <= 0) {
            return 100;
        }

        double percentage =
                ((double) elapsedMillis / totalMillis)
                        * 100.0;

        return Math.min(
                100,
                Math.max(0, percentage)
        );
    }

    // =========================================================
    // GET CA CERTIFICATES
    @Override
    public List<CertificateEntity> getCaCertificates() {

        return certificateRepository
                .findByCaTrueAndStatusNot("ARCHIVED");
    }

    // =========================================================
// GET MY CERTIFICATES
    @Override
    public List<CertificateDTO> getMyCertificates() {
        String currentUser = getCurrentUsername();
        if (currentUser == null) return List.of();

        return certificateRepository
                .findMyCertificates(currentUser, "ARCHIVED")
                .stream()
                .map(this::toDto)
                .toList();
    }
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return null; // or "SYSTEM" depending on your policy
        }

        String username = authentication.getName();

        // Spring sometimes returns "anonymousUser"
        if ("anonymousUser".equalsIgnoreCase(username)) {
            return null; // or handle as SYSTEM
        }

        return username;
    }

    // =========================================================
// GET ALL CERTIFICATES
// =========================================================
    @Override
    public List<CertificateDTO> getAllCertificates() {

        return certificateRepository
                .findByStatusNot("ARCHIVED")
                .stream()
                .map(this::toDto)
                .toList();
    }
    @Override
    public byte[] downloadDer(Long id) throws Exception {

        CertificateEntity cert =
                certificateRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Certificate not found"
                                ));

        CertificateFactory factory =
                CertificateFactory.getInstance("X.509");

        X509Certificate x509 =
                (X509Certificate) factory.generateCertificate(
                        new ByteArrayInputStream(
                                cert.getCertificate().getBytes()
                        )
                );

        return x509.getEncoded();
    }

    // =========================================================
// GET REVOKED CERTIFICATES
// =========================================================
    @Override
    public List<CertificateDTO> getRevokedCertificates() {

        return certificateRepository.findAll()
                .stream()
                .filter(cert ->
                        "REVOKED".equalsIgnoreCase(
                                cert.getStatus()
                        )
                )
                .map(this::toDto)
                .toList();
    }

    @Override
    public String archiveCertificate(Long id) {

        CertificateEntity cert = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));

        if ("REVOKED".equalsIgnoreCase(cert.getStatus())) {
            throw new RuntimeException("Cannot archive a revoked certificate");
        }

        if ("ARCHIVED".equalsIgnoreCase(cert.getStatus())) {
            return "Certificate already archived";
        }

        cert.setStatus("ARCHIVED");
        cert.setRevokedAt(LocalDateTime.now());
        cert.setRevocationReason("ARCHIVED_BY_USER");

        certificateRepository.save(cert);

        return "Certificate archived successfully";
    }
    public String importCertificate(MultipartFile file, String alias) throws Exception {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Certificate file is required");
        }

        CertificateFactory factory = CertificateFactory.getInstance("X.509");

        byte[] data = file.getBytes();
        ByteArrayInputStream inputStream = new ByteArrayInputStream(data);

        X509Certificate cert;

        try {
            // Try PEM/DER directly
            cert = (X509Certificate) factory.generateCertificate(inputStream);
        } catch (Exception e) {
            throw new RuntimeException("Invalid certificate format (must be PEM or DER)");
        }

        cert.checkValidity();

        String certAlias = (alias != null && !alias.isBlank())
                ? alias
                : cert.getSubjectX500Principal().getName();

        // Prevent duplicates
        if (certificateRepository.findByAlias(certAlias).isPresent()) {
            throw new RuntimeException("Certificate with alias already exists: " + certAlias);
        }

        CertificateEntity entity = new CertificateEntity();

        entity.setAlias(certAlias);
        entity.setCertificate(file.getOriginalFilename());
        entity.setCertificate(extractPem(cert)); // store PEM
        entity.setStatus("ACTIVE");

        entity.setSerialNumber(cert.getSerialNumber().toString());
        entity.setIssuer(cert.getIssuerX500Principal().getName());
        entity.setSignatureAlgorithm(cert.getSigAlgName());

        entity.setCreatedAt(LocalDateTime.now());
        entity.setExpiryDate(cert.getNotAfter().toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime());

        entity.setSubject(cert.getSubjectX500Principal().getName());

        certificateRepository.save(entity);

        return "Certificate imported successfully: " + certAlias;
    }
    private String extractPem(X509Certificate cert) throws Exception {
        StringWriter sw = new StringWriter();

        try (JcaPEMWriter pemWriter = new JcaPEMWriter(sw)) {
            pemWriter.writeObject(cert);
        }

        return sw.toString();
    }
    @Override
    public List<CertificateDTO> getExpiredCertificates() {

        LocalDateTime now = LocalDateTime.now();

        return certificateRepository.findAll()
                .stream()
                .filter(cert ->
                        cert.getExpiryDate() != null
                                && cert.getExpiryDate().isBefore(now)
                )
                .map(this::toDto)
                .toList();
    }

    // Improved expiry email sender
    public void sendExpiryEmail(String to, CertificateEntity cert) {

        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setTo(to);
            message.setSubject("Certificate Expiry Warning - Action Required");

            long daysRemaining = java.time.Duration.between(
                    LocalDateTime.now(),
                    cert.getExpiryDate()
            ).toDays();

            message.setText(
                    "Dear User,\n\n" +
                            "Your certificate is approaching its expiry date.\n\n" +
                            "Certificate Alias: " + cert.getAlias() + "\n" +
                            "Expires in: " + daysRemaining + " days\n" +
                            "Expiry Date: " + cert.getExpiryDate() + "\n\n" +
                            "Please renew it before it expires to avoid service disruption.\n\n" +
                            "Best regards,\nPKI Certificate Management System"
            );

            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("Failed to send expiry email: " + e.getMessage());
        }
    }

    @Override
    public List<CertificateNotificationDTO> getExpiryNotifications() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(30);

        return certificateRepository.findAll()
                .stream()
                .filter(cert -> cert.getExpiryDate() != null)
                .filter(cert ->
                        cert.getExpiryDate().isBefore(threshold)
                )
                .map(cert -> {

                    long days = java.time.Duration.between(
                            now,
                            cert.getExpiryDate()
                    ).toDays();

                    CertificateNotificationDTO dto = new CertificateNotificationDTO();
                    dto.setId(cert.getId());
                    dto.setAlias(cert.getAlias());
                    dto.setExpiryDate(cert.getExpiryDate());
                    dto.setDaysRemaining(days);

                    dto.setStatus(days < 0 ? "EXPIRED" : "EXPIRING_SOON");

                    return dto;
                })
                .toList();
    }

    @Scheduled(cron = "0 0 9 * * *") // every day at 9 AM
    public void checkExpiringCertificates() {

        List<CertificateEntity> certs = certificateRepository.findAll();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(30);

        for (CertificateEntity cert : certs) {

            if (cert.getExpiryDate() == null) continue;

            // Only send if expiring within next 30 days (and still valid)
            if (cert.getExpiryDate().isBefore(threshold)
                    && cert.getExpiryDate().isAfter(now)) {

                notificationService.notifyCertificateExpiringSoon(cert);
            }

            if (cert.getExpiryDate().isBefore(now)) {
                notificationService.notifyCertificateExpired(cert);
            }
        }
    }

    @Override
    public List<CertificateDTO> getExpiringSoonCertificates() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(30);

        return certificateRepository.findAll()
                .stream()
                .filter(cert ->
                        cert.getExpiryDate() != null
                                && cert.getExpiryDate().isAfter(now)
                                && cert.getExpiryDate().isBefore(threshold)
                )
                .map(this::toDto)
                .toList();
    }
    // =========================================================
// GET CERTIFICATE CHAIN
// =========================================================
    @Override
    public List<CertificateDTO> getCertificateChain(Long id) {
        CertificateEntity cert = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));

        List<CertificateDTO> chain = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        CertificateEntity current = cert;

        while (current != null) {
            // Prevent infinite path traversal loops
            if (!visited.add(current.getAlias())) {
                throw new RuntimeException("Certificate chain loop detected");
            }

            // Add to array ordered from Leaf upwards
            chain.add(toDto(current));

            // If it's a self-signed Root CA, its issuer will match its own alias or be empty
            String issuerAlias = current.getIssuerAlias();
            if (issuerAlias == null || issuerAlias.isBlank() || issuerAlias.equalsIgnoreCase(current.getAlias())) {
                break;
            }

            // Handle structural type breaks early
            if ("ROOT_CA".equalsIgnoreCase(current.getType())) {
                break;
            }

            Optional<CertificateEntity> issuerOpt = certificateRepository.findByAlias(issuerAlias);
            if (issuerOpt.isEmpty()) {
                break;
            }

            CertificateEntity issuer = issuerOpt.get();

            // Structural constraint safety check
            if (!Boolean.TRUE.equals(issuer.getCa())) {
                break;
            }

            current = issuer;
        }

        // Reverse the list so it maps sequentially: [Root CA -> Intermediate CA -> Leaf]
        Collections.reverse(chain);

        return chain;
    }

    @Override
    @Transactional
    public String renewCertificate(
            Long id,
            String caAlias,
            String pin,
            int validityDays
    ) throws Exception {

        try {


            if (id == null)
                throw new RuntimeException("Certificate ID is required");

            if (pin == null || pin.isBlank())
                throw new RuntimeException("HSM PIN is required");

            if (caAlias == null || caAlias.isBlank())
                throw new RuntimeException("CA Alias is required");

            if (validityDays <= 0)
                throw new RuntimeException("Validity days must be > 0");


            CertificateEntity oldCertEntity =
                    certificateRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Certificate not found"));

            if ("REVOKED".equalsIgnoreCase(oldCertEntity.getStatus())) {
                throw new RuntimeException("Cannot renew revoked certificate");
            }

            // =========================================================
            // 3. LOAD PKCS#11 PROVIDER
            // =========================================================
            Provider provider = Security.getProvider("SunPKCS11-SoftHSM");

            if (provider == null) {
                throw new RuntimeException("PKCS11 provider not initialized");
            }

            if (Security.getProvider("BC") == null) {
                Security.addProvider(new org.bouncycastle.jce.provider.BouncyCastleProvider());
            }

            // =========================================================
            // 4. OPEN HSM SESSION
            // =========================================================
            KeyStore ks = KeyStore.getInstance("PKCS11", provider);
            ks.load(null, pin.toCharArray());

            // DEBUG: PRINT AVAILABLE ALIASES (VERY IMPORTANT)
            Enumeration<String> aliases = ks.aliases();
            System.out.println("==== HSM ALIASES ====");
            while (aliases.hasMoreElements()) {
                System.out.println(" -> " + aliases.nextElement());
            }

            // =========================================================
            // 5. CHECK CA KEY EXISTS
            // =========================================================
            if (!ks.containsAlias(caAlias)) {
                throw new RuntimeException("CA alias NOT found in HSM: " + caAlias);
            }

            Key key = ks.getKey(caAlias, pin.toCharArray());

            if (!(key instanceof PrivateKey caPrivateKey)) {
                throw new RuntimeException("CA private key not accessible for alias: " + caAlias);
            }

            X509Certificate caCert =
                    (X509Certificate) ks.getCertificate(caAlias);

            if (caCert == null) {
                throw new RuntimeException("CA certificate missing in HSM for alias: " + caAlias);
            }

            caCert.checkValidity();

            // =========================================================
            // 6. PARSE OLD CERTIFICATE (FIXED PEM PARSING)
            // =========================================================
            CertificateFactory certFactory = CertificateFactory.getInstance("X.509");

            X509Certificate oldX509 = (X509Certificate) certFactory.generateCertificate(
                    new java.io.ByteArrayInputStream(
                            oldCertEntity.getCertificate().getBytes()
                    )
            );

            PublicKey subjectPublicKey = oldX509.getPublicKey();
            X500Name subjectDN = new X500Name(oldX509.getSubjectX500Principal().getName());

            // =========================================================
            // 7. DATE & SERIAL
            // =========================================================
            Date notBefore = new Date();
            Date notAfter = new Date(System.currentTimeMillis() + (validityDays * 86400000L));
            BigInteger serial = BigInteger.valueOf(System.currentTimeMillis());

            // =========================================================
            // 8. BUILD CERTIFICATE
            // =========================================================
            JcaX509v3CertificateBuilder builder = new JcaX509v3CertificateBuilder(
                    caCert,
                    serial,
                    notBefore,
                    notAfter,
                    subjectDN,
                    subjectPublicKey
            );

            builder.addExtension(
                    Extension.basicConstraints,
                    true,
                    new BasicConstraints(false)
            );

            builder.addExtension(
                    Extension.subjectKeyIdentifier,
                    false,
                    new SubjectKeyIdentifier(subjectPublicKey.getEncoded())
            );

            builder.addExtension(
                    Extension.authorityKeyIdentifier,
                    false,
                    new AuthorityKeyIdentifier(caCert.getPublicKey().getEncoded())
            );

            // =========================================================
            // 9. SIGN CERTIFICATE
            // =========================================================
            String sigAlg = caPrivateKey.getAlgorithm().equalsIgnoreCase("EC")
                    ? "SHA256withECDSA"
                    : "SHA256withRSA";

            ContentSigner signer = new JcaContentSignerBuilder(sigAlg)
                    .setProvider(provider)
                    .build(caPrivateKey);

            X509Certificate renewedCert =
                    new JcaX509CertificateConverter()
                            .setProvider("BC")
                            .getCertificate(builder.build(signer));

            // =========================================================
            // 10. CONVERT TO PEM
            // =========================================================
            StringWriter sw = new StringWriter();
            try (org.bouncycastle.openssl.jcajce.JcaPEMWriter writer =
                         new org.bouncycastle.openssl.jcajce.JcaPEMWriter(sw)) {
                writer.writeObject(renewedCert);
            }

            String pem = sw.toString();

            // =========================================================
            // 11. UPDATE DB
            // =========================================================
            oldCertEntity.setCertificate(pem);
            oldCertEntity.setSerialNumber(serial.toString());
            oldCertEntity.setIssuerAlias(caAlias);
            oldCertEntity.setIssuer(caCert.getSubjectX500Principal().getName());
            oldCertEntity.setSignatureAlgorithm(renewedCert.getSigAlgName());
            oldCertEntity.setStatus("ACTIVE");
            // oldCertEntity.setCreatedAt(LocalDateTime.now());
            oldCertEntity.setExpiryDate(LocalDateTime.now().plusDays(validityDays));

            certificateRepository.save(oldCertEntity);

            // =========================================================
            // 12. SEND RENEWAL NOTIFICATION (optional)
            // =========================================================
            notificationService.notifyCertificateIssued(oldCertEntity);

            // =========================================================
            // 13. AUDIT
            // =========================================================
            AuditContext audit = new AuditContext();
            audit.setUser(getCurrentUser());
            audit.setAction("RENEW_CERTIFICATE");
            audit.setTarget(oldCertEntity.getAlias());
            audit.setIp("SYSTEM");
            audit.setEndpoint("/api/certificates/" + id + "/renew");
            audit.setCorrelationId(UUID.randomUUID().toString());
            audit.setStatus(AuditStatus.SUCCESS);
            audit.setDetails("Certificate renewed successfully");

            auditService.log(audit);

            return pem;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("RENEW FAILED: " + e.getMessage(), e);
        }
    }
    // Provided mock user fallback container function to clean compilation scope issues
    private String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            return auth.getName();
        }
        return "anonymousUser";
    }
}

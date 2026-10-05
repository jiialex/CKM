package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.bouncycastle.asn1.pkcs.PKCSObjectIdentifiers;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.*;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509ExtensionUtils;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.openssl.jcajce.JcaPEMWriter;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.pkcs.PKCS10CertificationRequest;
import org.bouncycastle.pkcs.jcajce.JcaPKCS10CertificationRequest;
import org.bouncycastle.pkcs.jcajce.JcaPKCS10CertificationRequestBuilder;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditContext;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CsrRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CsrResponse;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.*;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.CertificateRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.CsrRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.KeyRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.StringReader;
import java.io.StringWriter;
import java.math.BigInteger;
import java.security.*;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class CsrServiceImpl implements CsrService {

    private final KeyRepository keyRepository;
    private final CsrRepository csrRepository;
    private final CertificateRepository certificateRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public CsrServiceImpl(KeyRepository keyRepository,
                          CsrRepository csrRepository,
                          CertificateRepository certificateRepository,
                          AuditService auditService,
                          NotificationService notificationService) {
        this.keyRepository = keyRepository;
        this.csrRepository = csrRepository;
        this.certificateRepository = certificateRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Override
    public CsrResponse generateCsr(CsrRequest request) throws Exception {

        KeyEntity key = keyRepository.findByAlias(request.getAlias())
                .orElseThrow(() -> new RuntimeException(
                        "Key not found: " + request.getAlias()));

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!Boolean.TRUE.equals(key.getEnabled())) {
            throw new RuntimeException(
                    "Key is disabled and cannot be used");
        }

        if (!Boolean.TRUE.equals(key.getIsHsmKey())) {
            throw new RuntimeException(
                    "CSR generation is only allowed for HSM keys");
        }

        if (Boolean.TRUE.equals(key.getCertificateBound())) {
            throw new RuntimeException(
                    "Key is already bound to a certificate");
        }

        if (request.getPin() == null || request.getPin().isBlank()) {
            throw new RuntimeException("HSM PIN is required");
        }

        if (request.getCommonName() == null ||
                request.getCommonName().isBlank()) {
            throw new RuntimeException(
                    "Common Name (CN) is required");
        }

        // =====================================================
        // LOAD PKCS11 PROVIDER
        // =====================================================

        Provider provider =
                Security.getProvider("SunPKCS11-SoftHSM");

        if (provider == null) {
            throw new RuntimeException(
                    "SunPKCS11-SoftHSM provider not found");
        }

        KeyStore ks =
                KeyStore.getInstance("PKCS11", provider);

        ks.load(null, request.getPin().toCharArray());

        // =====================================================
        // LOAD PRIVATE KEY
        // =====================================================

        PrivateKey privateKey =
                (PrivateKey) ks.getKey(
                        request.getAlias(),
                        null);

        if (privateKey == null) {
            throw new RuntimeException(
                    "Private key not found in HSM for alias: "
                            + request.getAlias());
        }

        System.out.println(
                "Private Key Algorithm = "
                        + privateKey.getAlgorithm());

        System.out.println(
                "DB Algorithm = "
                        + key.getAlgorithm());

        System.out.println(
                "DB Key Size = "
                        + key.getKeySize());

        // =====================================================
        // KEY SIZE VALIDATION
        // =====================================================

        if ("RSA".equalsIgnoreCase(key.getAlgorithm())
                && key.getKeySize() != null
                && key.getKeySize() < 512) {

            throw new RuntimeException(
                    "RSA key size too small: "
                            + key.getKeySize()
                            + " bits");
        }

        // =====================================================
        // SIGNATURE ALGORITHM VALIDATION
        // =====================================================

        String sigAlg = request.getSignatureAlgorithm();

        if ("RSA".equalsIgnoreCase(key.getAlgorithm())
                && sigAlg.contains("ECDSA")) {

            throw new RuntimeException(
                    "ECDSA signature algorithm selected for RSA key");
        }

        if ("EC".equalsIgnoreCase(key.getAlgorithm())
                && sigAlg.contains("RSA")) {

            throw new RuntimeException(
                    "RSA signature algorithm selected for EC key");
        }

        // =====================================================
        // PUBLIC KEY
        // =====================================================

        Certificate cert =
                ks.getCertificate(request.getAlias());

        if (cert == null) {
            throw new RuntimeException(
                    "No certificate/public key object found "
                            + "for alias: "
                            + request.getAlias());
        }

        PublicKey publicKey =
                cert.getPublicKey();

        if (publicKey == null) {
            throw new RuntimeException(
                    "Unable to extract public key");
        }

        if (publicKey instanceof java.security.interfaces.RSAPublicKey rsa) {

            int bits =
                    rsa.getModulus().bitLength();

            System.out.println(
                    "RSA Modulus Bits = "
                            + bits);

            if (bits < 512) {
                throw new RuntimeException(
                        "RSA public key size is "
                                + bits
                                + " bits. Minimum is 512.");
            }
        }

        // =====================================================
        // SUBJECT DN
        // =====================================================

        String dn =
                buildDistinguishedName(request);

        if (dn.isBlank()) {
            throw new RuntimeException(
                    "Subject DN cannot be empty");
        }

        X500Name subject =
                new X500Name(dn);

        JcaPKCS10CertificationRequestBuilder builder =
                new JcaPKCS10CertificationRequestBuilder(
                        subject,
                        publicKey);

        // =====================================================
        // EXTENSIONS
        // =====================================================

        ExtensionsGenerator extGen =
                new ExtensionsGenerator();

        BasicConstraints basicConstraints;

        if (request.isCa()) {

            int pathLen =
                    request.getPathLength() != null
                            ? request.getPathLength()
                            : 0;

            basicConstraints =
                    new BasicConstraints(pathLen);

        } else {

            basicConstraints =
                    new BasicConstraints(false);
        }

        extGen.addExtension(
                Extension.basicConstraints,
                true,
                basicConstraints);

        // Key Usage

        int usage =
                buildKeyUsage(
                        request.getKeyUsages());

        if (usage != 0) {
            extGen.addExtension(
                    Extension.keyUsage,
                    true,
                    new KeyUsage(usage));
        }

        // SAN

        List<GeneralName> sanList =
                new ArrayList<>();

        if (request.getDnsNames() != null) {

            for (String dns : request.getDnsNames()) {

                if (dns != null &&
                        !dns.isBlank()) {

                    sanList.add(
                            new GeneralName(
                                    GeneralName.dNSName,
                                    dns.trim()));
                }
            }
        }

        if (request.getIpAddresses() != null) {

            for (String ip : request.getIpAddresses()) {

                if (ip != null &&
                        !ip.isBlank()) {

                    sanList.add(
                            new GeneralName(
                                    GeneralName.iPAddress,
                                    ip.trim()));
                }
            }
        }

        if (!sanList.isEmpty()) {

            extGen.addExtension(
                    Extension.subjectAlternativeName,
                    false,
                    new GeneralNames(
                            sanList.toArray(
                                    new GeneralName[0])));
        }

        builder.addAttribute(
                PKCSObjectIdentifiers.pkcs_9_at_extensionRequest,
                extGen.generate());

        // =====================================================
        // SIGN CSR
        // =====================================================

        ContentSigner signer;

        try {

            signer =
                    new JcaContentSignerBuilder(sigAlg)
                            .setProvider(provider)
                            .build(privateKey);

        } catch (Exception ex) {

            throw new RuntimeException(
                    "Failed to create signer. "
                            + "Key Algorithm="
                            + privateKey.getAlgorithm()
                            + ", Signature Algorithm="
                            + sigAlg
                            + ", Key Size="
                            + key.getKeySize()
                            + ", Cause="
                            + ex.getMessage(),
                    ex);
        }

        PKCS10CertificationRequest csr =
                builder.build(signer);

        String pem =
                convertToPem(csr);

        // =====================================================
        // SAVE CSR
        // =====================================================

        CsrEntity entity =
                new CsrEntity();
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String username = authentication.getName();

        entity.setCreatedBy(username);
        entity.setCsrAlias(request.getCsrAlias());
        entity.setKeyAlias(request.getAlias());

        entity.setCsrPem(pem);

        entity.setCommonName(request.getCommonName());
        entity.setOrganization(request.getOrganization());
        entity.setOrganizationalUnit(
                request.getOrganizationalUnit());

        entity.setCountry(request.getCountry());
        entity.setState(request.getState());
        entity.setLocality(request.getLocality());
        entity.setEmail(request.getEmail());

        entity.setSignatureAlgorithm(
                request.getSignatureAlgorithm());

        entity.setNotBefore(
                request.getNotBefore());

        entity.setNotAfter(
                request.getNotAfter());

        entity.setCa(request.isCa());
        entity.setPathLength(
                request.getPathLength());

        entity.setSubjectKeyIdentifier(
                request.isSubjectKeyIdentifier());

        entity.setAuthorityKeyIdentifier(
                request.isAuthorityKeyIdentifier());

        entity.setKeyUsages(
                request.getKeyUsages());

        entity.setExtendedKeyUsages(
                request.getExtendedKeyUsages());

        entity.setDnsNames(
                request.getDnsNames());

        entity.setIpAddresses(
                request.getIpAddresses());

        entity.setOcspUrl(
                request.getOcspUrl());

        entity.setCaIssuersUrl(
                request.getCaIssuersUrl());

        entity.setCrlUrls(
                request.getCrlUrls());

        entity.setStatus(CsrStatus.PENDING);

        entity.setCreatedAt(
                LocalDateTime.now());

        csrRepository.save(entity);

        // TODO: notify the appropriate CA operator that a new CSR is pending.
        // Left out for now — send me NotificationService.java and I'll wire
        // this in with the correct method signature so it compiles cleanly.
        // e.g. notificationService.notifyCsrSubmitted(entity);

        return new CsrResponse(pem);
    }

    private String buildDistinguishedName(CsrRequest req) {
        StringBuilder dn = new StringBuilder();
        appendIfNotEmpty(dn, "CN=", req.getCommonName());
        appendIfNotEmpty(dn, "O=", req.getOrganization());
        appendIfNotEmpty(dn, "OU=", req.getOrganizationalUnit());
        appendIfNotEmpty(dn, "C=", req.getCountry() != null ? req.getCountry().toUpperCase() : null);
        appendIfNotEmpty(dn, "ST=", req.getState());
        appendIfNotEmpty(dn, "L=", req.getLocality());
        appendIfNotEmpty(dn, "EMAILADDRESS=", req.getEmail());

        String result = dn.toString();
        if (result.endsWith(",")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }

    private void appendIfNotEmpty(StringBuilder sb, String prefix, String value) {
        if (value != null && !value.trim().isEmpty()) {
            sb.append(prefix).append(value.trim()).append(",");
        }
    }

    // =====================================================
    // APPROVE CSR — ACTUALLY SIGNS AND ISSUES A CERTIFICATE
    // =====================================================
    @Override
    public void approveCsr(Long id, String caAlias, String caPin) throws Exception {

        CsrEntity csr = csrRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CSR not found"));

        if (csr.getStatus() != CsrStatus.PENDING) {
            throw new RuntimeException("Only pending CSRs can be approved");
        }

        if (caAlias == null || caAlias.isBlank()) {
            throw new RuntimeException("caAlias is required to sign this CSR");
        }
        if (caPin == null || caPin.isBlank()) {
            throw new RuntimeException("caPin is required to unlock the CA's private key");
        }

        // ---------- Load and validate the signing CA ----------
        CertificateEntity caCert = certificateRepository.findByAlias(caAlias)
                .orElseThrow(() -> new RuntimeException("CA certificate not found: " + caAlias));

        if (!Boolean.TRUE.equals(caCert.getCa())) {
            throw new RuntimeException("Certificate '" + caAlias + "' is not a CA certificate and cannot sign CSRs");
        }
        if ("REVOKED".equalsIgnoreCase(caCert.getStatus())) {
            throw new RuntimeException("CA certificate '" + caAlias + "' is revoked and cannot sign");
        }
        if (caCert.getKeyAlias() == null || caCert.getKeyAlias().isBlank()) {
            throw new RuntimeException("CA certificate '" + caAlias + "' has no associated signing key");
        }

        KeyEntity caKey = keyRepository.findByAlias(caCert.getKeyAlias())
                .orElseThrow(() -> new RuntimeException("CA signing key not found: " + caCert.getKeyAlias()));

        // ---------- Parse the CA's own certificate (for issuer name + public key) ----------
        CertificateFactory certFactory = CertificateFactory.getInstance("X.509");
        X509Certificate caX509 = (X509Certificate) certFactory.generateCertificate(
                new ByteArrayInputStream(caCert.getCertificate().getBytes()));
        X500Name issuerDn = new JcaX509CertificateHolder(caX509).getSubject();
        PublicKey caPublicKey = caX509.getPublicKey();

        // ---------- Unlock the CA's private key in the HSM ----------
        Provider provider = Security.getProvider("SunPKCS11-SoftHSM");
        if (provider == null) {
            throw new RuntimeException("SunPKCS11-SoftHSM provider not found");
        }

        KeyStore ks = KeyStore.getInstance("PKCS11", provider);
        ks.load(null, caPin.toCharArray());

        PrivateKey caPrivateKey = (PrivateKey) ks.getKey(caCert.getKeyAlias(), null);
        if (caPrivateKey == null) {
            throw new RuntimeException("CA private key not found in HSM for alias: " + caCert.getKeyAlias()
                    + " (check the PIN)");
        }

        // ---------- Parse the pending CSR back into a PKCS10 request ----------
        PKCS10CertificationRequest pkcs10;
        try (PEMParser pemParser = new PEMParser(new StringReader(csr.getCsrPem()))) {
            Object parsed = pemParser.readObject();
            if (!(parsed instanceof PKCS10CertificationRequest)) {
                throw new RuntimeException("Stored CSR PEM is not a valid PKCS#10 request");
            }
            pkcs10 = (PKCS10CertificationRequest) parsed;
        }

        PublicKey subjectPublicKey = new JcaPKCS10CertificationRequest(pkcs10)
                .setProvider("BC")
                .getPublicKey();

        X500Name subjectDn = pkcs10.getSubject();

        // ---------- Serial number + validity ----------
        BigInteger serial = new BigInteger(64, new SecureRandom()).abs();

        Date notBefore = csr.getNotBefore() != null
                ? java.sql.Timestamp.valueOf(csr.getNotBefore())
                : new Date();
        Date notAfter = csr.getNotAfter() != null
                ? java.sql.Timestamp.valueOf(csr.getNotAfter())
                : new Date(System.currentTimeMillis() + 365L * 24 * 60 * 60 * 1000);

        // ---------- Build the certificate ----------
        JcaX509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                issuerDn, serial, notBefore, notAfter, subjectDn, subjectPublicKey
        );

        BasicConstraints basicConstraints = Boolean.TRUE.equals(csr.getCa())
                ? new BasicConstraints(csr.getPathLength() != null ? csr.getPathLength() : 0)
                : new BasicConstraints(false);
        certBuilder.addExtension(Extension.basicConstraints, true, basicConstraints);

        int usage = buildKeyUsage(csr.getKeyUsages());
        if (usage != 0) {
            certBuilder.addExtension(Extension.keyUsage, true, new KeyUsage(usage));
        }

        List<GeneralName> sanList = new ArrayList<>();
        if (csr.getDnsNames() != null) {
            for (String dns : csr.getDnsNames()) {
                if (dns != null && !dns.isBlank()) {
                    sanList.add(new GeneralName(GeneralName.dNSName, dns.trim()));
                }
            }
        }
        if (csr.getIpAddresses() != null) {
            for (String ip : csr.getIpAddresses()) {
                if (ip != null && !ip.isBlank()) {
                    sanList.add(new GeneralName(GeneralName.iPAddress, ip.trim()));
                }
            }
        }
        if (!sanList.isEmpty()) {
            certBuilder.addExtension(Extension.subjectAlternativeName, false,
                    new GeneralNames(sanList.toArray(new GeneralName[0])));
        }

        JcaX509ExtensionUtils extUtils = new JcaX509ExtensionUtils();
        if (Boolean.TRUE.equals(csr.getSubjectKeyIdentifier())) {
            certBuilder.addExtension(Extension.subjectKeyIdentifier, false,
                    extUtils.createSubjectKeyIdentifier(subjectPublicKey));
        }
        if (Boolean.TRUE.equals(csr.getAuthorityKeyIdentifier())) {
            certBuilder.addExtension(Extension.authorityKeyIdentifier, false,
                    extUtils.createAuthorityKeyIdentifier(caPublicKey));
        }

        // ---------- Sign with the CA's private key ----------
        String sigAlg = "EC".equalsIgnoreCase(caKey.getAlgorithm())
                ? "SHA256withECDSA"
                : "SHA256withRSA";

        ContentSigner signer;
        try {
            signer = new JcaContentSignerBuilder(sigAlg)
                    .setProvider(provider)
                    .build(caPrivateKey);
        } catch (Exception ex) {
            throw new RuntimeException(
                    "Failed to create CA signer. CA Key Algorithm=" + caKey.getAlgorithm()
                            + ", Signature Algorithm=" + sigAlg + ", Cause=" + ex.getMessage(), ex);
        }

        X509CertificateHolder holder = certBuilder.build(signer);

        X509Certificate x509Cert = new JcaX509CertificateConverter()
                .setProvider("BC")
                .getCertificate(holder);

        String certPem = convertToPem(x509Cert);

        // ---------- Save the issued certificate ----------
        String operatorUsername = getCurrentUsername();

        MessageDigest sha256 = MessageDigest.getInstance("SHA-256");

        CertificateEntity certEntity = new CertificateEntity();
        certEntity.setAlias(csr.getCsrAlias());
        certEntity.setKeyAlias(csr.getKeyAlias());
        certEntity.setCertificate(certPem);
        certEntity.setCommonName(csr.getCommonName());
        certEntity.setOrganization(csr.getOrganization());
        certEntity.setOrganizationalUnit(csr.getOrganizationalUnit());
        certEntity.setCountry(csr.getCountry());
        certEntity.setState(csr.getState());
        certEntity.setLocality(csr.getLocality());
        certEntity.setEmail(csr.getEmail());
        certEntity.setSubject(subjectDn.toString());
        certEntity.setType(Boolean.TRUE.equals(csr.getCa()) ? "CA" : "END_ENTITY");
        certEntity.setStatus("ACTIVE");
        certEntity.setSerialNumber(serial.toString(16));
        certEntity.setIssuer(issuerDn.toString());
        certEntity.setIssuerAlias(caAlias);
        certEntity.setSignatureAlgorithm(sigAlg);
        certEntity.setCa(csr.getCa());
        certEntity.setPathLength(csr.getPathLength());
        certEntity.setCreatedAt(LocalDateTime.now());
        certEntity.setExpiryDate(csr.getNotAfter());
        certEntity.setCreatedBy(csr.getCreatedBy());
        certEntity.setIssuedBy(operatorUsername);
        // FIXED: previously assigned the CSR's own list instances directly
        // (certEntity.setX(csr.getX())). Since csr is a Hibernate-managed
        // entity, its @ElementCollection lists are tracked by identity —
        // handing that same List object to a second managed entity
        // (certEntity) triggers "Found shared references to a collection".
        // Wrapping each in `new ArrayList<>(...)` gives certEntity its own
        // independent copy.
        certEntity.setKeyUsages(csr.getKeyUsages() == null ? new ArrayList<>() : new ArrayList<>(csr.getKeyUsages()));
        certEntity.setExtendedKeyUsages(csr.getExtendedKeyUsages() == null ? new ArrayList<>() : new ArrayList<>(csr.getExtendedKeyUsages()));
        certEntity.setDnsNames(csr.getDnsNames() == null ? new ArrayList<>() : new ArrayList<>(csr.getDnsNames()));
        certEntity.setIpAddresses(csr.getIpAddresses() == null ? new ArrayList<>() : new ArrayList<>(csr.getIpAddresses()));
        certEntity.setCrlUrls(csr.getCrlUrls() == null ? new ArrayList<>() : new ArrayList<>(csr.getCrlUrls()));
        certEntity.setFingerprint(bytesToHex(sha256.digest(x509Cert.getEncoded())));
        certEntity.setPublicKeyHash(bytesToHex(sha256.digest(subjectPublicKey.getEncoded())));
        certEntity.setCsrHash(bytesToHex(sha256.digest(csr.getCsrPem().getBytes())));

        certificateRepository.save(certEntity);

        // ---------- Update the CSR itself ----------
        csr.setStatus(CsrStatus.ISSUED);
        csr.setIssued(true);
        csrRepository.save(csr);

        notificationService.notifyCsrApproved(csr);

        auditService.log(
                audit("CSR_APPROVED_AND_ISSUED", csr.getCsrAlias(), "SUCCESS")
        );
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    @Override
    public boolean validateCsr(Long id) {

        CsrEntity csr = csrRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CSR not found"));

        if (csr.getCsrPem() == null ||
                csr.getCsrPem().isBlank()) {

            return false;
        }

        if (csr.getCommonName() == null ||
                csr.getCommonName().isBlank()) {

            return false;
        }

        return true;
    }
    @Override
    public void withdrawCsr(Long id) {

        CsrEntity csr = csrRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CSR not found"));

        if (!csr.getCreatedBy().equals(getCurrentUsername())) {
            throw new RuntimeException("Unauthorized");
        }

        if (csr.getStatus() == CsrStatus.ISSUED) {
            throw new RuntimeException(
                    "Issued CSR cannot be withdrawn"
            );
        }

        csr.setStatus(CsrStatus.WITHDRAWN);

        csrRepository.save(csr);

        auditService.log(
                audit("CSR_WITHDRAWN",
                        csr.getCsrAlias(),
                        "SUCCESS")
        );
    }
    @Override
    public void rejectCsr(Long id, String reason) {

        CsrEntity csr = csrRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CSR not found"));

        if (csr.getStatus() != CsrStatus.PENDING) {
            throw new RuntimeException("Only pending CSRs can be rejected");
        }

        csr.setStatus(CsrStatus.REJECTED);
        csr.setRejectionReason(reason);

        csrRepository.save(csr);

        notificationService.notifyCsrRejected(csr);

        auditService.log(
                audit("CSR_REJECTED",
                        csr.getCsrAlias(),
                        "SUCCESS")
        );
    }

    // FIXED: importCsr now sets `ca = false` by default. Previously this
    // field was left null, which meant an imported CSR matched NEITHER
    // findByStatusAndCa(PENDING, false) NOR findByStatusAndCa(PENDING, true)
    // — so it never appeared in either the end-entity or intermediate-CA
    // pending queue.
    @Override
    public CsrEntity importCsr(String alias, String pem) {

        CsrEntity entity = new CsrEntity();

        entity.setCsrAlias(alias);
        entity.setCsrPem(pem);
        entity.setCa(false); // FIXED — was missing, caused null 'ca' field

        entity.setStatus(CsrStatus.PENDING);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setCreatedBy(getCurrentUsername());

        return csrRepository.save(entity);
    }

    @Override
    public void deleteCsr(Long id) {

        CsrEntity csr = csrRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CSR not found"));

        if (!csr.getCreatedBy().equals(getCurrentUsername())) {
            throw new RuntimeException("Unauthorized");
        }

        csrRepository.delete(csr);

        auditService.log(audit("CSR_DELETED", csr.getCsrAlias(), "SUCCESS"));
    }
    private int buildKeyUsage(List<String> keyUsages) {
        if (keyUsages == null) return 0;

        Map<String, Integer> map = Map.of(
                "digitalSignature", KeyUsage.digitalSignature,
                "nonRepudiation", KeyUsage.nonRepudiation,
                "keyEncipherment", KeyUsage.keyEncipherment,
                "dataEncipherment", KeyUsage.dataEncipherment,
                "keyAgreement", KeyUsage.keyAgreement,
                "keyCertSign", KeyUsage.keyCertSign,
                "cRLSign", KeyUsage.cRLSign
        );

        int usage = 0;
        for (String u : keyUsages) {
            Integer bit = map.get(u);
            if (bit != null) usage |= bit;
        }
        return usage;
    }
    @Override
    public byte[] exportCsr(Long id) {

        CsrEntity csr = csrRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CSR not found"));

        if (!csr.getCreatedBy().equals(getCurrentUsername())) {
            throw new RuntimeException("Unauthorized");
        }

        auditService.log(audit("CSR_EXPORTED", csr.getCsrAlias(), "SUCCESS"));

        return csr.getCsrPem().getBytes();
    }
    private String convertToPem(Object obj) throws Exception {
        StringWriter sw = new StringWriter();
        try (JcaPEMWriter pw = new JcaPEMWriter(sw)) {
            pw.writeObject(obj);
        }
        return sw.toString();
    }

    // ==================== Other methods ====================

    // FIXED: previously used csrRepository.findByStatusAndCa(PENDING, false),
    // which is an EXACT match and silently excludes any CSR whose `ca`
    // field is null (e.g. anything from importCsr before this fix, or any
    // future row where `ca` doesn't get set for whatever reason). Filtering
    // in code with "!Boolean.TRUE.equals(...)" treats null the same as
    // false, so nothing pending gets lost.
    @Override public List<CsrEntity> getPendingEndEntityCsrs() {
        return csrRepository.findByStatus(CsrStatus.PENDING).stream()
                .filter(c -> !Boolean.TRUE.equals(c.getCa()))
                .toList();
    }

    // FIXED: same null-safety issue as above, mirrored for the CA/intermediate
    // queue — only rows explicitly marked ca = true show up here.
    @Override public List<CsrEntity> getPendingIntermediateCaCsrs() {
        return csrRepository.findByStatus(CsrStatus.PENDING).stream()
                .filter(c -> Boolean.TRUE.equals(c.getCa()))
                .toList();
    }

    @Override public List<CsrEntity> getApprovedCsrs() {
        return csrRepository.findAll().stream()
                .filter(c -> CsrStatus.APPROVED.equals(c.getStatus()))
                .toList();
    }

    @Override public List<CsrEntity> getRejectedCsrs() {
        return csrRepository.findAll().stream()
                .filter(c -> CsrStatus.REJECTED.equals(c.getStatus()))
                .toList();
    }

    @Override public List<CsrEntity> getMyCsrs() {
        return csrRepository.findByCreatedBy(getCurrentUsername());
    }

    @Override public List<CsrEntity> getAllCsrs() {
        return csrRepository.findAll();
    }

    @Override public List<CsrEntity> getPendingCsrs() {
        return csrRepository.findByStatus(CsrStatus.PENDING);
    }

    private String getCurrentUsername() {
        return org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
    }
    @Override
    public CsrEntity getCsrById(Long id) {

        System.out.println("Fetching CSR: " + id);

        CsrEntity csr = csrRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("CSR not found"));

        System.out.println("CSR found: " + csr.getId());

        return csr;
    }
    private AuditContext audit(String action, String target, String status) {
        AuditContext ctx = new AuditContext();
        ctx.setUser(getCurrentUsername());
        ctx.setAction(action);
        ctx.setTarget(target);
        ctx.setStatus(AuditStatus.SUCCESS);
        ctx.setEndpoint("/api/csr");
        return ctx;
    }
}
package org.insa.pki.certificatemanagement.certificateManagmentBackend.service.ca;

import org.bouncycastle.asn1.x500.AttributeTypeAndValue;
import org.bouncycastle.asn1.x500.RDN;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.*;
import org.bouncycastle.cert.jcajce.*;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;
import org.bouncycastle.openssl.jcajce.JcaPEMWriter;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.pkcs.PKCS10CertificationRequest;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.*;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.*;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.*;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.AuditService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.StringReader;
import java.io.StringWriter;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class CAServiceImpl implements CAService {

    private final KeyRepository keyRepository;
    private final CertificateRepository certificateRepository;
    private final CsrRepository csrRepository;
    private final AuditService auditService;

    public CAServiceImpl(
            KeyRepository keyRepository,
            CertificateRepository certificateRepository,
            CsrRepository csrRepository,
            AuditService auditService
    ) {
        this.keyRepository = keyRepository;
        this.certificateRepository = certificateRepository;
        this.csrRepository = csrRepository;
        this.auditService = auditService;
    }

    // =========================================================
    // ROOT CA GENERATION
    // =========================================================
    @Override
    public String generateRootCA(RootCARequest request) throws Exception {

        KeyStore ks = loadHsm(request.getPin());

        KeyEntity key = keyRepository.findByAlias(request.getKeyAlias())
                .orElseThrow(() -> new RuntimeException("Key not found"));

        PrivateKey privateKey =
                (PrivateKey) ks.getKey(request.getKeyAlias(), request.getPin().toCharArray());

        if (privateKey == null) {
            throw new RuntimeException("Private key not accessible from HSM");
        }

        X509Certificate keyCert =
                (X509Certificate) ks.getCertificate(request.getKeyAlias());

        if (keyCert == null) {
            throw new RuntimeException("HSM certificate missing for alias");
        }

        PublicKey publicKey = keyCert.getPublicKey();

        X500Name subject = buildSubject(
                request.getCommonName(),
                request.getOrganization(),
                request.getOrganizationalUnit(),
                request.getCountry()
        );

        X509Certificate cert = buildCertificate(
                subject,
                subject,
                publicKey,
                privateKey,
                request.getValidityDays(),
                true,
                request.getPathLength() == null ? 0 : request.getPathLength(),
                request.getKeyUsages(),
                request.getExtendedKeyUsages()
        );

        String pem = toPem(cert);

        CertificateEntity entity = new CertificateEntity();
        entity.setAlias(request.getAlias());
        entity.setKeyAlias(request.getKeyAlias());
        entity.setCertificate(pem);
        entity.setType("ROOT_CA");
        entity.setStatus("ACTIVE");

        entity.setSubject(cert.getSubjectX500Principal().getName());
        entity.setIssuer(cert.getIssuerX500Principal().getName());
        entity.setSerialNumber(cert.getSerialNumber().toString());

        entity.setCa(true);
        entity.setPathLength(request.getPathLength());

        entity.setIssuerAlias(request.getAlias());           // Root CA issues itself
        entity.setIssuer(request.getAlias());                // or subject name
        entity.setIssuerAlias(request.getAlias());           // ← ADD THIS
        entity.setCreatedAt(LocalDateTime.now());
        entity.setExpiryDate(
                cert.getNotAfter().toInstant()
                        .atZone(java.time.ZoneId.systemDefault())
                        .toLocalDateTime()
        );

        entity.setCreatedBy(getUser());

        certificateRepository.save(entity);

        audit("ROOT_CA_CREATED", request.getAlias());

        return pem;
    }

    @Override
    public String signIntermediateCsr(Long csrId, String caAlias, String pin, int validityDays) throws Exception {

        CsrEntity csrEntity = csrRepository.findById(csrId)
                .orElseThrow(() -> new RuntimeException("CSR not found"));

        if (Boolean.TRUE.equals(csrEntity.getIssued())) {
            throw new RuntimeException("CSR already issued");
        }

        if (csrEntity.getStatus() != CsrStatus.APPROVED) {
            throw new RuntimeException("Only APPROVED CSR can be signed");
        }

        // Parse CSR
        PEMParser pemParser = new PEMParser(new StringReader(csrEntity.getCsrPem()));
        PKCS10CertificationRequest csr = (PKCS10CertificationRequest) pemParser.readObject();
        pemParser.close();

        if (csr == null) {
            throw new RuntimeException("Invalid CSR format");
        }

        // Load HSM
        KeyStore ks = loadHsm(pin);
        PrivateKey caPrivateKey = (PrivateKey) ks.getKey(caAlias, pin.toCharArray());
        if (caPrivateKey == null) {
            throw new RuntimeException("CA private key not found for alias: " + caAlias);
        }

        X509Certificate caCert = (X509Certificate) ks.getCertificate(caAlias);
        if (caCert == null) {
            throw new RuntimeException("CA certificate not found for alias: " + caAlias);
        }

        PublicKey subjectPublicKey = new JcaPEMKeyConverter()
                .setProvider("BC")
                .getPublicKey(csr.getSubjectPublicKeyInfo());

        // Build Certificate
        X509Certificate cert = buildCertificate(
                new X500Name(caCert.getSubjectX500Principal().getName()),
                csr.getSubject(),
                subjectPublicKey,
                caPrivateKey,
                validityDays,
                true,           // isCA = true for Intermediate
                0,
                List.of("digitalSignature", "keyCertSign", "cRLSign"),
                List.of("serverAuth", "clientAuth")
        );

        String pem = toPem(cert);

        // Save Certificate Entity
        CertificateEntity entity = new CertificateEntity();
        entity.setAlias(csrEntity.getCsrAlias());
        entity.setKeyAlias(csrEntity.getKeyAlias());
        entity.setCertificate(pem);
        entity.setType("INTERMEDIATE_CA");
        entity.setCertificateType("INTERMEDIATE_CA");
        entity.setStatus("ISSUED");

        entity.setIssuerAlias(caAlias);
        entity.setIssuer(caCert.getSubjectX500Principal().getName());
        entity.setSubject(cert.getSubjectX500Principal().getName());

        // Subject fields
        X500Name subjectName = csr.getSubject();
        entity.setCommonName(getSubjectField(subjectName, "CN"));
        entity.setOrganization(getSubjectField(subjectName, "O"));
        entity.setOrganizationalUnit(getSubjectField(subjectName, "OU"));
        entity.setCountry(getSubjectField(subjectName, "C"));
        entity.setState(getSubjectField(subjectName, "ST"));
        entity.setLocality(getSubjectField(subjectName, "L"));
        entity.setEmail(getSubjectField(subjectName, "E"));

        entity.setSerialNumber(cert.getSerialNumber().toString());
        entity.setSignatureAlgorithm(cert.getSigAlgName());
        entity.setCa(true);
        entity.setPathLength(0);

        entity.setCreatedAt(LocalDateTime.now());
        entity.setExpiryDate(LocalDateTime.now().plusDays(validityDays));

        entity.setCreatedBy(getUser());           // Who signed it
        entity.setIssuedBy(csrEntity.getCreatedBy()); // Original requester

        entity.setFingerprint(cert.getSerialNumber().toString());
        entity.setCsrHash(Integer.toHexString(csrEntity.getCsrPem().hashCode()));

        certificateRepository.save(entity);

        // Update CSR
        csrEntity.setIssued(true);
        csrEntity.setStatus(CsrStatus.ISSUED);
        csrRepository.save(csrEntity);

        audit("INTERMEDIATE_CA_SIGNED", csrEntity.getCsrAlias());

        return pem;
    }
    private String getFromX500(X500Name name, String oid) {
        for (RDN rdn : name.getRDNs()) {
            AttributeTypeAndValue atv = rdn.getFirst();
            if (atv != null && atv.getType().getId().contains(oid)) {
                return atv.getValue().toString();
            }
        }
        return null;
    }
    private String getSubjectField(X500Name name, String field) {
        if (name == null) return null;

        for (RDN rdn : name.getRDNs()) {
            AttributeTypeAndValue atv = rdn.getFirst();
            if (atv == null) continue;

            String oid = atv.getType().getId();

            switch (field) {
                case "CN" -> { if (oid.contains("2.5.4.3")) return atv.getValue().toString(); }
                case "O"  -> { if (oid.contains("2.5.4.10")) return atv.getValue().toString(); }
                case "OU" -> { if (oid.contains("2.5.4.11")) return atv.getValue().toString(); }
                case "C"  -> { if (oid.contains("2.5.4.6")) return atv.getValue().toString(); }
                case "ST" -> { if (oid.contains("2.5.4.8")) return atv.getValue().toString(); }
                case "L"  -> { if (oid.contains("2.5.4.7")) return atv.getValue().toString(); }
                case "E"  -> { if (oid.contains("1.2.840.113549.1.9.1")) return atv.getValue().toString(); }
            }
        }
        return null;
    }
    @Override
    public List<?> getAllCACertificates() {
        return certificateRepository.findAll()
                .stream()
                .filter(c -> c.getCa() != null && c.getCa())
                .toList();
    }

    @Override
    public List<CertificateTreeNode> getCAHierarchy() {
        return List.of(); // implement later (tree build logic)
    }


    private KeyStore loadHsm(String pin) throws Exception {
        Provider provider = Security.getProvider("SunPKCS11-SoftHSM");
        if (provider == null) {
            throw new RuntimeException("PKCS11 provider not found");
        }

        KeyStore ks = KeyStore.getInstance("PKCS11", provider);
        ks.load(null, pin.toCharArray());
        return ks;
    }

    private X500Name buildSubject(String cn, String o, String ou, String c) {
        return new X500Name("CN=" + cn + ", O=" + o + ", OU=" + ou + ", C=" + c);
    }

    private String toPem(X509Certificate cert) throws Exception {
        StringWriter sw = new StringWriter();
        try (JcaPEMWriter writer = new JcaPEMWriter(sw)) {
            writer.writeObject(cert);
        }
        return sw.toString();
    }

    private void audit(String action, String alias) {
        AuditContext ctx = new AuditContext();
        ctx.setUser(getUser());
        ctx.setAction(action);
        ctx.setTarget(alias);
        ctx.setStatus(AuditStatus.SUCCESS);
        auditService.log(ctx);
    }

    private String getUser() {
        return org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
    }

    // =========================================================
    // CERTIFICATE BUILDER
    // =========================================================
    private X509Certificate buildCertificate(
            X500Name subject,
            X500Name issuer,
            PublicKey pub,
            PrivateKey priv,
            int days,
            boolean isCA,
            int pathLen,
            List<String> keyUsages,
            List<String> ekuList
    ) throws Exception {

        BigInteger serial = BigInteger.valueOf(System.currentTimeMillis());
        Date notBefore = new Date();
        Date notAfter = new Date(System.currentTimeMillis() + days * 86400000L);

        JcaX509v3CertificateBuilder builder =
                new JcaX509v3CertificateBuilder(
                        issuer,
                        serial,
                        notBefore,
                        notAfter,
                        subject,
                        pub
                );
        if (isCA) {
            builder.addExtension(
                    Extension.basicConstraints,
                    true,
                    new BasicConstraints(pathLen)
            );
        } else {
            builder.addExtension(
                    Extension.basicConstraints,
                    true,
                    new BasicConstraints(false)
            );
        }

        builder.addExtension(
                Extension.subjectKeyIdentifier,
                false,
                new JcaX509ExtensionUtils().createSubjectKeyIdentifier(pub)
        );

        builder.addExtension(
                Extension.authorityKeyIdentifier,
                false,
                new JcaX509ExtensionUtils().createAuthorityKeyIdentifier(pub)
        );

        ContentSigner signer =
                new JcaContentSignerBuilder("SHA256withRSA")
                        .build(priv);

        return new JcaX509CertificateConverter()
                .setProvider("BC")
                .getCertificate(builder.build(signer));
    }
}
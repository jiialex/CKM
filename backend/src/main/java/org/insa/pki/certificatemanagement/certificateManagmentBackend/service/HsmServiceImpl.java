package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import jakarta.servlet.http.HttpServletRequest;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.*;
import org.bouncycastle.cert.jcajce.*;
import org.bouncycastle.operator.*;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditContext;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.KeyRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditStatus;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.KeyEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.KeyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigInteger;
import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Set;

@Service
public class HsmServiceImpl implements HsmService {

    private final KeyRepository keyRepository;
    private final AuditService auditService;
    private final SecurityThreatService threatService;

    private static final Set<String> ALLOWED_ALGOS = Set.of("RSA", "EC");

    private static final Set<String> RSA_SIGNING_ALGOS = Set.of(
            "SHA256withRSA",
            "SHA384withRSA",
            "SHA512withRSA",
            "SHA256withRSAandMGF1",
            "SHA384withRSAandMGF1",
            "SHA512withRSAandMGF1"
    );

    private static final Set<String> EC_SIGNING_ALGOS = Set.of(
            "SHA256withECDSA",
            "SHA384withECDSA",
            "SHA512withECDSA"
    );

    public HsmServiceImpl(KeyRepository keyRepository,
                          AuditService auditService,
                          SecurityThreatService threatService) {
        this.keyRepository = keyRepository;
        this.auditService = auditService;
        this.threatService = threatService;
    }

    private String getCurrentUsername() {
        var auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return "SYSTEM";
        }

        return auth.getName();
    }

    @Override
    public String generateKey(KeyRequest request) {

        AuditContext ctx = new AuditContext();

        try {
            System.out.println("🔐 Starting key generation...");

            if (request == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is null");
            }

            if (request.getAlgorithm() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Algorithm is required");
            }

            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (attrs == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No HTTP request context available");
            }

            HttpServletRequest http = attrs.getRequest();

            String username = (http.getUserPrincipal() != null)
                    ? http.getUserPrincipal().getName()
                    : "UNKNOWN";

            ctx.setUser(username);
            ctx.setAction("GENERATE_KEY");
            ctx.setEndpoint("/api/hsm/generate");
            ctx.setIp(http.getRemoteAddr());

            // validate() now throws ResponseStatusException(BAD_REQUEST, ...) directly
            validate(request);

            // FIXED: was `throw new RuntimeException("Alias already exists")`, which the
            // catch-all below rewrapped into a generic RuntimeException with no HTTP status
            // info — Spring had no way to know this should be a 409, so it fell back to a
            // bare 500 with no useful message reaching the frontend.
            if (keyRepository.findByAlias(request.getAlias()).isPresent()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Alias '" + request.getAlias() + "' already exists — choose a different alias.");
            }

            Provider provider = Security.getProvider("SunPKCS11-SoftHSM");

            if (provider == null) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "HSM Provider not found: SunPKCS11-SoftHSM (check SoftHSM config)");
            }

            KeyStore ks = KeyStore.getInstance("PKCS11", provider);
            ks.load(null, request.getPassword().toCharArray());

            String algo = request.getAlgorithm().toUpperCase();

            KeyPairGenerator kpg;

            if ("RSA".equals(algo)) {
                kpg = KeyPairGenerator.getInstance("RSA", provider);
                kpg.initialize(request.getKeySize());
            } else if ("EC".equals(algo)) {
                kpg = KeyPairGenerator.getInstance("EC", provider);
                kpg.initialize(new ECGenParameterSpec(request.getCurveName()));
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only RSA and EC are supported");
            }

            KeyPair kp = kpg.generateKeyPair();

            String signingAlgo = resolveSigningAlgorithm(request, algo);

            ContentSigner signer = new JcaContentSignerBuilder(signingAlgo)
                    .setProvider(provider)
                    .build(kp.getPrivate());

            long now = System.currentTimeMillis();

            X500Name dn = new X500Name("CN=" + request.getAlias());

            X509CertificateHolder holder = new JcaX509v3CertificateBuilder(
                    dn,
                    BigInteger.valueOf(now),
                    new Date(now),
                    new Date(now + 86400000L),
                    dn,
                    kp.getPublic()
            ).build(signer);

            java.security.cert.X509Certificate cert =
                    new JcaX509CertificateConverter()
                            .setProvider("BC")
                            .getCertificate(holder);

            ks.setKeyEntry(
                    request.getAlias(),
                    kp.getPrivate(),
                    null,
                    new java.security.cert.Certificate[]{cert}
            );

            KeyEntity entity = new KeyEntity();
            entity.setAlias(request.getAlias());
            entity.setAlgorithm(algo);
            entity.setKeySize(request.getKeySize());
            entity.setCurveName(request.getCurveName());
            entity.setPublicKey(Base64.getEncoder().encodeToString(kp.getPublic().getEncoded()));
            entity.setIsHsmKey(true);
            entity.setHsmLabel(request.getAlias());
            entity.setCreatedBy(getCurrentUsername());
            entity.setCreatedAt(LocalDateTime.now());

            keyRepository.save(entity);

            ctx.setTarget(request.getAlias());
            ctx.setStatus(AuditStatus.SUCCESS);

            System.out.println("✅ Key generated successfully: " + request.getAlias());

            return "Key successfully generated: " + request.getAlias();

        } catch (ResponseStatusException e) {
            // A known, already-classified error (bad input, duplicate alias, HSM
            // unavailable, etc). Log it for audit purposes but do NOT rewrap it —
            // rewrapping was exactly what destroyed the HTTP status information
            // before it could reach the controller/frontend.
            ctx.setStatus(AuditStatus.FAILED);
            ctx.setDetails(e.getReason());
            throw e;

        } catch (Exception e) {
            // Only truly unexpected exceptions (crypto library errors, IO errors, etc.)
            // land here, and only these should genuinely be a 500.
            ctx.setStatus(AuditStatus.FAILED);
            ctx.setDetails(e.getMessage());
            e.printStackTrace(); // IMPORTANT for debugging

            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "HSM Key generation failed: " + e.getMessage(), e);

        } finally {
            auditService.log(ctx);
            threatService.analyze(ctx);
        }
    }

    private String resolveSigningAlgorithm(KeyRequest request, String algo) {

        String signingAlgo = request.getSigningAlgorithm();

        if (signingAlgo == null || signingAlgo.isBlank()) {
            return "RSA".equals(algo)
                    ? "SHA256withRSA"
                    : "SHA256withECDSA";
        }

        signingAlgo = signingAlgo.trim();

        if ("RSA".equals(algo) && !RSA_SIGNING_ALGOS.contains(signingAlgo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid RSA signing algorithm");
        }

        if ("EC".equals(algo) && !EC_SIGNING_ALGOS.contains(signingAlgo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid EC signing algorithm");
        }

        return signingAlgo;
    }

    private void validate(KeyRequest request) {

        if (request.getAlias() == null || request.getAlias().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Alias is required");
        }

        if (request.getPassword() == null || request.getPassword().length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PIN must be at least 4 characters");
        }

        String algo = request.getAlgorithm().toUpperCase();

        if (!ALLOWED_ALGOS.contains(algo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only RSA and EC supported");
        }

        if (algo.equals("RSA") && request.getKeySize() < 2048) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "RSA must be >= 2048");
        }

        if (algo.equals("EC")) {
            if (request.getCurveName() == null || request.getCurveName().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Curve name required");
            }

            if (!"secp256r1".equals(request.getCurveName())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only secp256r1 allowed");
            }
        }
    }

    @Override
    public List<KeyEntity> getMyKeys() {
        String username = getCurrentUsername();
        return keyRepository.findByCreatedBy(username);
    }
}

package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.bouncycastle.asn1.ocsp.OCSPObjectIdentifiers;
import org.bouncycastle.asn1.ocsp.ResponderID;
import org.bouncycastle.asn1.x509.CRLReason;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.Extensions;
import org.bouncycastle.cert.ocsp.*;
        import org.bouncycastle.cert.jcajce.JcaX509CertificateHolder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.operator.jcajce.JcaDigestCalculatorProviderBuilder;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.*;
        import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.CertificateRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.RevokedCertificateRepository;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Date;

@Service
public class OcspResponderService {

    private final CertificateRepository certificateRepository;
    private final RevokedCertificateRepository revokedRepository;

    public OcspResponderService(
            CertificateRepository certificateRepository,
            RevokedCertificateRepository revokedRepository
    ) {
        this.certificateRepository = certificateRepository;
        this.revokedRepository = revokedRepository;
    }

    /**
     * MAIN OCSP ENTRY POINT
     */
    public byte[] processOcspRequest(byte[] requestBytes) throws Exception {

        // 1. Parse OCSP request (ASN.1 decoding)
        OCSPReq ocspReq = new OCSPReq(requestBytes);

        OCSPReq req = ocspReq;

        Req[] requests = req.getRequestList();
        if (requests.length == 0) {
            throw new RuntimeException("Empty OCSP request");
        }

        Req singleReq = requests[0];
        CertificateID certId = singleReq.getCertID();

        BigInteger serial = certId.getSerialNumber();

        // 2. Lookup certificate
        CertificateEntity certEntity =
                certificateRepository.findBySerialNumber(serial.toString())
                        .orElse(null);

        // 3. Build OCSP response generator
        CertificateStatus status = getCertificateStatus(serial.toString());

        // 4. Load responder certificate + key
        ResponderData responder = loadResponderKey();

        JcaX509CertificateHolder responderCertHolder =
                new JcaX509CertificateHolder(responder.certificate);

        RespID responderId = new RespID(ResponderID.getInstance(responderCertHolder));
        BasicOCSPRespBuilder builder = new BasicOCSPRespBuilder(responderId);

        builder.addResponse(certId, status);

        // 5. Add optional nonce (prevents replay attacks)
        Extension nonce = req.getExtension(OCSPObjectIdentifiers.id_pkix_ocsp_nonce);
        if (nonce != null) {
            builder.setResponseExtensions(new Extensions(nonce));
        }

        // 6. Sign response
        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
                .build(responder.privateKey);

        BasicOCSPResp basicResp =
                builder.build(signer, null, new Date());

        OCSPRespBuilder respBuilder = new OCSPRespBuilder();

        OCSPResp ocspResp =
                respBuilder.build(OCSPResp.SUCCESSFUL, basicResp);

        return ocspResp.getEncoded();
    }

    /**
     * MAP CERT STATUS (DB → OCSP)
     */
    private CertificateStatus getCertificateStatus(String serialNumber) {

        boolean revoked = revokedRepository
                .findBySerialNumber(serialNumber)
                .isPresent();

        if (revoked) {
            return new RevokedStatus(new Date(), CRLReason.keyCompromise);
        }

        return CertificateStatus.GOOD;
    }

    /**
     * LOAD OCSP RESPONDER KEY
     * (You can replace with HSM / SoftHSM later)
     */
    private ResponderData loadResponderKey() throws Exception {

        KeyStore ks = KeyStore.getInstance("PKCS12");
        ks.load(getClass().getResourceAsStream("/ocsp-responder.p12"),
                "password".toCharArray());

        String alias = ks.aliases().nextElement();

        PrivateKey key = (PrivateKey) ks.getKey(alias, "password".toCharArray());
        X509Certificate cert = (X509Certificate) ks.getCertificate(alias);

        return new ResponderData(key, cert);
    }

    /**
     * HOLDER CLASS
     */
    private static class ResponderData {
        PrivateKey privateKey;
        X509Certificate certificate;

        ResponderData(PrivateKey privateKey, X509Certificate certificate) {
            this.privateKey = privateKey;
            this.certificate = certificate;
        }
    }
}

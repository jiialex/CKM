package org.insa.pki.certificatemanagement.certificateManagmentBackend.security;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.KeyEntity;

import java.io.ByteArrayInputStream;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;

public class CertificateUtils {



    public static X509Certificate parse(String pem) throws Exception {
        CertificateFactory factory = CertificateFactory.getInstance("X.509");

        try (ByteArrayInputStream in =
                     new ByteArrayInputStream(pem.getBytes())) {
            return (X509Certificate) factory.generateCertificate(in);
        }
    }


    @Deprecated
    public static void parsePrivateKey(KeyEntity keyEntity) {
        throw new UnsupportedOperationException(
                "Private keys are managed exclusively by HSM. DB-based private key parsing is disabled."
        );
    }
}
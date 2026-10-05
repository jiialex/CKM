package org.insa.pki.certificatemanagement.certificateManagmentBackend.security;

import org.springframework.stereotype.Component;

import java.security.*;
import java.util.Base64;

@Component
public class SignatureUtil {

    private final KeyPair keyPair;

    public SignatureUtil() {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
            kpg.initialize(2048);
            this.keyPair = kpg.generateKeyPair();

        } catch (Exception e) {
            throw new RuntimeException("Key initialization failed", e);
        }
    }

    public String sign(String data) {
        try {
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initSign(keyPair.getPrivate());
            signature.update(data.getBytes());

            return Base64.getEncoder().encodeToString(signature.sign());

        } catch (Exception e) {
            throw new RuntimeException("Signing failed", e);
        }
    }

    public boolean verify(String data, String signatureStr) {
        try {
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initVerify(keyPair.getPublic());
            signature.update(data.getBytes());

            byte[] sigBytes = Base64.getDecoder().decode(signatureStr);
            return signature.verify(sigBytes);

        } catch (Exception e) {
            throw new RuntimeException("Verification failed", e);
        }
    }
}
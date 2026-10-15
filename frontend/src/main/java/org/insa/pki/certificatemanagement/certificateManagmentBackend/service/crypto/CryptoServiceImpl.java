package org.insa.pki.certificatemanagement.certificateManagmentBackend.service.crypto;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.KeyRequest;
import org.springframework.stereotype.Service;

import java.security.*;
import java.security.spec.ECGenParameterSpec;

@Service
public class CryptoServiceImpl implements CryptoService {

    @Override
    public KeyPair generateKeyPair(KeyRequest request) throws Exception {

        String algorithm = request.getAlgorithm().toUpperCase();
        KeyPairGenerator generator;

        switch (algorithm) {

            case "RSA":
                generator = KeyPairGenerator.getInstance("RSA");
                generator.initialize(request.getKeySize(), new SecureRandom());
                break;

            case "EC":
                generator = KeyPairGenerator.getInstance("EC");
                String curve = request.getCurveName() != null
                        ? request.getCurveName()
                        : "secp256r1";

                generator.initialize(
                        new ECGenParameterSpec(curve),
                        new SecureRandom()
                );
                break;

            default:
                throw new IllegalArgumentException(
                        "❌ Unsupported algorithm for HSM-only policy: " + algorithm
                );
        }

        return generator.generateKeyPair();
    }
}
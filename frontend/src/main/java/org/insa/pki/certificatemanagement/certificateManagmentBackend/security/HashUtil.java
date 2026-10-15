package org.insa.pki.certificatemanagement.certificateManagmentBackend.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public class HashUtil {

    private static final String ALGORITHM = "SHA-256";

    public static String sha256(String data) {
        if (data == null) {
            data = "";
        }

        try {
            MessageDigest digest = MessageDigest.getInstance(ALGORITHM);

            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();

            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }

            return hex.toString();

        } catch (Exception e) {
            throw new RuntimeException("Hashing failed using " + ALGORITHM, e);
        }
    }
}
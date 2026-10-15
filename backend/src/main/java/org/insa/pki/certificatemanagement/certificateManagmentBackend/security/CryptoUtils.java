package org.insa.pki.certificatemanagement.certificateManagmentBackend.security;


import org.bouncycastle.jcajce.provider.asymmetric.edec.BCEdDSAPrivateKey;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.KeyEntity;
import org.bouncycastle.jce.provider.BouncyCastleProvider;

import java.security.Security;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

public class CryptoUtils {

    private static final String ALGO = "AES";
    private static final String TRANSFORMATION = "AES";

    public static String encrypt(String data, String password) throws Exception {
        SecretKey key = deriveKey(password);

        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, key);

        byte[] encrypted = cipher.doFinal(data.getBytes());
        return Base64.getEncoder().encodeToString(encrypted);
    }




    public static String decrypt(String data, String password) throws Exception {


        if (data.contains("BEGIN") || data.contains("PRIVATE KEY")) {
            return data;
        }

        try {
            Base64.getDecoder().decode(data);
        } catch (Exception e) {
            throw new RuntimeException("Key is not Base64 or not encrypted");
        }

        try {
            SecretKey key = deriveKey(password);

            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, key);

            byte[] decoded = Base64.getDecoder().decode(data);

            return new String(cipher.doFinal(decoded));

        } catch (Exception e) {
            throw new RuntimeException(
                    "Decryption failed → WRONG password OR data was not encrypted with this system", e
            );
        }
    }

    private static SecretKey deriveKey(String password) throws Exception {
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), "salt".getBytes(), 65536, 256);
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        byte[] keyBytes = factory.generateSecret(spec).getEncoded();

        return new SecretKeySpec(keyBytes, ALGO);
    }
}
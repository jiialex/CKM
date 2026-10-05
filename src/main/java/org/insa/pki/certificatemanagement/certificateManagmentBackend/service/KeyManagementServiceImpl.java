package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.KeyImportRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.KeyRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.KeyEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.KeyRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.security.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Enumeration;
import java.util.List;

@Service
public class KeyManagementServiceImpl implements KeyManagementService {

    private final KeyRepository keyRepository;
    private final HsmService hsmService;

    public KeyManagementServiceImpl(KeyRepository keyRepository,
                                    HsmService hsmService) {
        this.keyRepository = keyRepository;
        this.hsmService = hsmService;
    }

    @Override
    public List<KeyEntity> listAllKeys() {
        return keyRepository.findAll();
    }

    @Override
    public KeyEntity getKeyDetails(String alias) {
        return keyRepository.findByAlias(alias)
                .orElseThrow(() -> new RuntimeException("Key not found"));
    }
    @Override
    public void deleteKey(String alias, String pin) throws Exception {

        KeyEntity key = keyRepository.findByAlias(alias)
                .orElseThrow(() -> new RuntimeException("Key not found"));

        if (!Boolean.TRUE.equals(key.getIsHsmKey())) {
            throw new RuntimeException("❌ Non-HSM keys are not allowed anymore");
        }

        Provider p = Security.getProvider("SunPKCS11-SoftHSM");
        KeyStore ks = KeyStore.getInstance("PKCS11", p);
        ks.load(null, pin.toCharArray());

        ks.deleteEntry(alias);

        keyRepository.delete(key);
    }
    public void disableKey(String alias) {
        KeyEntity key = keyRepository.findByAlias(alias)
                .orElseThrow(() -> new RuntimeException("Key not found"));

        key.setEnabled(false);
        keyRepository.save(key);
    }
    public void enableKey(String alias) {
        KeyEntity key = keyRepository.findByAlias(alias)
                .orElseThrow(() -> new RuntimeException("Key not found"));

        key.setEnabled(true);
        keyRepository.save(key);
    }
    @Override
    public void importKey(
            MultipartFile file,
            KeyImportRequest request
    ) throws Exception {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }

        if (request.getAlias() == null || request.getAlias().isBlank()) {
            throw new RuntimeException("Alias is required");
        }

        if (keyRepository.findByAlias(request.getAlias()).isPresent()) {
            throw new RuntimeException("Alias already exists");
        }

        String content =
                new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);

        PublicKey publicKey;

        switch (request.getFileType().toUpperCase()) {

            case "PEM":
            case "PUBLIC_KEY":

                String pem = content
                        .replace("-----BEGIN PUBLIC KEY-----", "")
                        .replace("-----END PUBLIC KEY-----", "")
                        .replaceAll("\\s", "");

                byte[] keyBytes = Base64.getDecoder().decode(pem);

                KeyFactory rsaFactory = KeyFactory.getInstance("RSA");

                try {
                    publicKey = rsaFactory.generatePublic(
                            new java.security.spec.X509EncodedKeySpec(keyBytes)
                    );
                } catch (Exception ex) {

                    KeyFactory ecFactory = KeyFactory.getInstance("EC");

                    publicKey = ecFactory.generatePublic(
                            new java.security.spec.X509EncodedKeySpec(keyBytes)
                    );
                }

                break;

            case "CRT":
            case "CER":

                java.security.cert.CertificateFactory cf =
                        java.security.cert.CertificateFactory.getInstance("X.509");

                java.security.cert.X509Certificate cert =
                        (java.security.cert.X509Certificate)
                                cf.generateCertificate(file.getInputStream());

                publicKey = cert.getPublicKey();

                break;

            default:
                throw new RuntimeException(
                        "Unsupported file type: " + request.getFileType()
                );
        }

        KeyEntity key = new KeyEntity();

        key.setAlias(request.getAlias());

        key.setAlgorithm(publicKey.getAlgorithm());

        key.setPublicKey(
                Base64.getEncoder()
                        .encodeToString(publicKey.getEncoded())
        );

        if ("RSA".equalsIgnoreCase(publicKey.getAlgorithm())) {

            java.security.interfaces.RSAPublicKey rsa =
                    (java.security.interfaces.RSAPublicKey) publicKey;

            key.setKeySize(rsa.getModulus().bitLength());

        } else if ("EC".equalsIgnoreCase(publicKey.getAlgorithm())) {

            key.setCurveName("secp256r1");
        }

        key.setIsHsmKey(false);

        key.setEnabled(true);

        key.setCertificateBound(false);

        key.setCreatedAt(LocalDateTime.now());

        keyRepository.save(key);
    }
    public String rotateKey(String alias, String pin) throws Exception {

        KeyEntity oldKey = keyRepository.findByAlias(alias)
                .orElseThrow(() -> new RuntimeException("Key not found"));

        if (Boolean.TRUE.equals(oldKey.getCertificateBound())) {
            throw new RuntimeException("Cannot rotate key in use by certificate");
        }

        String newAlias = alias + "_rot_" + System.currentTimeMillis();

        KeyRequest request = new KeyRequest();
        request.setAlias(newAlias);
        request.setAlgorithm(oldKey.getAlgorithm());
        request.setKeySize(oldKey.getKeySize());
        request.setCurveName(oldKey.getCurveName());
        request.setPassword(pin);

        hsmService.generateKey(request);

        deleteKey(alias, pin);

        return newAlias;
    }

    @Override
    public String exportPublicKey(String alias) {

        KeyEntity key = keyRepository.findByAlias(alias)
                .orElseThrow(() -> new RuntimeException("Key not found"));

        return key.getPublicKey();
    }






}
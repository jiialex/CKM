package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.KeyImportRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.KeyEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface KeyManagementService {

    // Existing
    List<KeyEntity> listAllKeys() throws Exception;

    KeyEntity getKeyDetails(String alias);

    void deleteKey(String alias, String pin) throws Exception;

    String rotateKey(String alias, String pin) throws Exception;


    String exportPublicKey(String alias);

    // Key state management
    void enableKey(String alias);

    void disableKey(String alias);

    // Import metadata/public key
    void importKey(MultipartFile file, KeyImportRequest request) throws Exception;
}
package org.insa.pki.certificatemanagement.certificateManagmentBackend.service.crypto;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.KeyRequest;

import java.security.KeyPair;

public interface CryptoService {
    KeyPair generateKeyPair(KeyRequest request) throws Exception;
}
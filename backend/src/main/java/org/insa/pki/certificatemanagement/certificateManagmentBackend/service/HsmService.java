package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.KeyRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.KeyEntity;

import java.util.List;


public interface HsmService {
    String generateKey(KeyRequest request) throws Exception;
    List<KeyEntity> getMyKeys();
}
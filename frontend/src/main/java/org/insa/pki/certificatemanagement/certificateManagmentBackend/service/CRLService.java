package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.RevokedCertificateDTO;

import java.util.List;

public interface CRLService {

    /**
     * Generates a new CRL for a CA (RFC 5280 compliant structure)
     */
    byte[] generateCRL(String caAlias, String pin) throws Exception;

    /**
     * Returns all revoked certificates in system
     */
    List<RevokedCertificateDTO> getRevokedCertificates();

    /**
     * Returns latest CRL for a CA
     */
    byte[] getLatestCRL(String caAlias);

    /**
     * Returns revocations created by current user
     */
    List<RevokedCertificateDTO> getMyRevokedCertificates();


}
package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CsrRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CsrResponse;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CsrEntity;

import java.util.List;
public interface CsrService {

    CsrResponse generateCsr(CsrRequest request) throws Exception;
    List<CsrEntity> getAllCsrs();
    List<CsrEntity> getMyCsrs();
    List<CsrEntity> getPendingEndEntityCsrs();
    List<CsrEntity> getPendingIntermediateCaCsrs();
    CsrEntity getCsrById(Long id);

    byte[] exportCsr(Long id);

    void deleteCsr(Long id);
    // Add these to your CsrService interface
    List<CsrEntity> getApprovedCsrs();
    List<CsrEntity> getRejectedCsrs();
    CsrEntity importCsr(String alias, String pem);
    List<CsrEntity> getPendingCsrs();

    // CHANGED: approveCsr now requires which CA signs it (caAlias) and that
    // CA's HSM PIN (caPin), since approval now performs the actual signing.
    void approveCsr(Long id, String caAlias, String caPin) throws Exception;

    void rejectCsr(Long id, String reason);

    boolean validateCsr(Long id);

    void withdrawCsr(Long id);
}
package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CertificateDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CertificateNotificationDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.SignCsrRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CertificateEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CertificateService {

    String signCsr(SignCsrRequest request) throws Exception;

    CertificateDTO getCertificateById(Long id);

    String downloadPem(Long id);

    byte[] downloadDer(Long id) throws Exception;

    boolean verifyCertificate(Long id);

    void revokeCertificate(Long id, String reason);

    String importCertificate(MultipartFile file, String alias) throws Exception;

    String archiveCertificate(Long id);

    String renewCertificate(
            Long id,
            String caAlias,
            String pin,
            int validityDays
    ) throws Exception;

    List<CertificateDTO> getAllCertificates();

    List<CertificateDTO> getMyCertificates();

    List<CertificateDTO> getRevokedCertificates();

    List<CertificateDTO> getExpiredCertificates();

    // NEW
    List<CertificateDTO> getExpiringSoonCertificates();

    // NEW
    List<CertificateNotificationDTO> getExpiryNotifications();

    List<CertificateDTO> getCertificateChain(Long id);

    List<CertificateEntity> getCaCertificates();
}
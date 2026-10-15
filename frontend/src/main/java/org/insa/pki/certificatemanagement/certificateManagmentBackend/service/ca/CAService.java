package org.insa.pki.certificatemanagement.certificateManagmentBackend.service.ca;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.CertificateTreeNode;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.RootCARequest;

import java.util.List;

public interface CAService {

    String generateRootCA(RootCARequest request) throws Exception;

    String signIntermediateCsr(
            Long csrId,
            String caAlias,
            String pin,
            int validityDays
    ) throws Exception;

    List<CertificateTreeNode> getCAHierarchy();

    List<?> getAllCACertificates();
}
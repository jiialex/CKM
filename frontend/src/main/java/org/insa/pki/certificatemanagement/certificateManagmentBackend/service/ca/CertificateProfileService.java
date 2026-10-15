package org.insa.pki.certificatemanagement.certificateManagmentBackend.service.ca;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CertificateProfile;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CertificateProfileService {

    private final Map<String, CertificateProfile> profiles = Map.of(
            "ROOT_CA", rootProfile(),
            "INTERMEDIATE_CA", intermediateProfile(),
            "RENEWED_CERT", endEntityProfile()
    );


    public CertificateProfile getProfile(String name) {
        CertificateProfile profile = profiles.get(name);

        if (profile == null) {
            throw new RuntimeException("Profile not found: " + name);
        }

        return profile;
    }


    private CertificateProfile rootProfile() {
        CertificateProfile p = new CertificateProfile();
        p.setKeyCertSign(true);
        p.setCRLSign(true);
        p.setDigitalSignature(true);
        return p;
    }

    private CertificateProfile intermediateProfile() {
        CertificateProfile p = new CertificateProfile();
        p.setKeyCertSign(true);
        p.setCRLSign(true);
        p.setDigitalSignature(true);
        return p;
    }

    private CertificateProfile endEntityProfile() {
        CertificateProfile p = new CertificateProfile();
        p.setDigitalSignature(true);
        p.setKeyEncipherment(true);
        p.setServerAuth(true);
        return p;
    }
}
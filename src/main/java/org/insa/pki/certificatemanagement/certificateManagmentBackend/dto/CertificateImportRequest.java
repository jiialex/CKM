package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class CertificateImportRequest {

    private String alias;
    private String certificate;

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public String getCertificate() {
        return certificate;
    }

    public void setCertificate(String certificate) {
        this.certificate = certificate;
    }
}
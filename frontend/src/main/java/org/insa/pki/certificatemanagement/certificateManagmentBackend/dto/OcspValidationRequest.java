package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class OcspValidationRequest {

    private String serialNumber;
    private String issuerAlias;

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getIssuerAlias() {
        return issuerAlias;
    }

    public void setIssuerAlias(String issuerAlias) {
        this.issuerAlias = issuerAlias;
    }
}
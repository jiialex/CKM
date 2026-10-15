package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class OcspValidationResponse {
    private String status;
    private String ocspUrl;

    public OcspValidationResponse() { }
    public OcspValidationResponse(String status, String ocspUrl) {
        this.status = status;
        this.ocspUrl = ocspUrl;
    }
    public String getStatus() {
        return status;
    }

    public String getOcspUrl() {
        return ocspUrl;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setOcspUrl(String ocspUrl) {
        this.ocspUrl = ocspUrl;
    }
}

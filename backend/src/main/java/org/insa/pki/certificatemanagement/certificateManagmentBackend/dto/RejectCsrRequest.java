package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class RejectCsrRequest {

    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
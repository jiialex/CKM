package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class RevocationResponse {

    private boolean revoked;
    private String status;
    private String message;

    public boolean isRevoked() {
        return revoked;
    }

    public void setRevoked(boolean revoked) {
        this.revoked = revoked;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
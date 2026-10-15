package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class RevocationRequest {

    private String certificateAlias;
    private String issuerAlias;

    private String reason;

    private String comment;

    public String getCertificateAlias() {
        return certificateAlias;
    }

    public void setCertificateAlias(String certificateAlias) {
        this.certificateAlias = certificateAlias;
    }

    public String getIssuerAlias() {
        return issuerAlias;
    }

    public void setIssuerAlias(String issuerAlias) {
        this.issuerAlias = issuerAlias;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
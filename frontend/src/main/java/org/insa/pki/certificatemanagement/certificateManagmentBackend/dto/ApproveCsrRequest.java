package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class ApproveCsrRequest {

    /** Alias of the CA certificate (a CertificateEntity where ca=true) that will sign this CSR. */
    private String caAlias;

    /** HSM PIN needed to unlock the CA's private key for signing. */
    private String caPin;

    public String getCaAlias() {
        return caAlias;
    }

    public void setCaAlias(String caAlias) {
        this.caAlias = caAlias;
    }

    public String getCaPin() {
        return caPin;
    }

    public void setCaPin(String caPin) {
        this.caPin = caPin;
    }
}
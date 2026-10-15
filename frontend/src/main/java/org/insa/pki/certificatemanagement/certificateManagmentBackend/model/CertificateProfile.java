package org.insa.pki.certificatemanagement.certificateManagmentBackend.model;

public class CertificateProfile {

    private String name;

    // KEY USAGE
    private boolean digitalSignature;
    private boolean keyEncipherment;
    private boolean keyCertSign;
    private boolean cRLSign;

    // EKU
    private boolean serverAuth;
    private boolean clientAuth;
    private boolean codeSigning;
    private boolean emailProtection;

    // POLICY OID
    private String policyOid;

    // =========================
    // Getters and Setters
    // =========================

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isDigitalSignature() {
        return digitalSignature;
    }

    public void setDigitalSignature(boolean digitalSignature) {
        this.digitalSignature = digitalSignature;
    }

    public boolean isKeyEncipherment() {
        return keyEncipherment;
    }

    public void setKeyEncipherment(boolean keyEncipherment) {
        this.keyEncipherment = keyEncipherment;
    }

    public boolean isKeyCertSign() {
        return keyCertSign;
    }

    public void setKeyCertSign(boolean keyCertSign) {
        this.keyCertSign = keyCertSign;
    }

    public boolean isCRLSign() {
        return cRLSign;
    }

    public void setCRLSign(boolean cRLSign) {
        this.cRLSign = cRLSign;
    }

    public boolean isServerAuth() {
        return serverAuth;
    }

    public void setServerAuth(boolean serverAuth) {
        this.serverAuth = serverAuth;
    }

    public boolean isClientAuth() {
        return clientAuth;
    }

    public void setClientAuth(boolean clientAuth) {
        this.clientAuth = clientAuth;
    }

    public boolean isCodeSigning() {
        return codeSigning;
    }

    public void setCodeSigning(boolean codeSigning) {
        this.codeSigning = codeSigning;
    }

    public boolean isEmailProtection() {
        return emailProtection;
    }

    public void setEmailProtection(boolean emailProtection) {
        this.emailProtection = emailProtection;
    }

    public String getPolicyOid() {
        return policyOid;
    }

    public void setPolicyOid(String policyOid) {
        this.policyOid = policyOid;
    }
}
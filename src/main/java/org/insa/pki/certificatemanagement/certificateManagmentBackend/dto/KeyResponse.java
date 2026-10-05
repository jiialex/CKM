package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class KeyResponse {

    private String publicKey;
    private String keyType;

    public KeyResponse() {
    }

    public KeyResponse(String publicKey, String keyType) {
        this.publicKey = publicKey;
        this.keyType = keyType;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public void setPublicKey(String publicKey) {
        this.publicKey = publicKey;
    }

    public String getKeyType() {
        return keyType;
    }

    public void setKeyType(String keyType) {
        this.keyType = keyType;
    }
}
package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class KeyRequest {

    private String algorithm;
    private int keySize;
    private String alias;
    private String password;
    private String curveName;

    private String signingAlgorithm;

    public KeyRequest() {}

    public String getCurveName() { return curveName; }
    public void setCurveName(String curveName) { this.curveName = curveName; }

    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }

    public int getKeySize() { return keySize; }
    public void setKeySize(int keySize) { this.keySize = keySize; }

    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getSigningAlgorithm() { return signingAlgorithm; }
    public void setSigningAlgorithm(String signingAlgorithm) {
        this.signingAlgorithm = signingAlgorithm;
    }
}
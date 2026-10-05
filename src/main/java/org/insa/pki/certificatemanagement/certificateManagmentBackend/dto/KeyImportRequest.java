package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class KeyImportRequest {

    private String alias;

    // PEM, CRT, CER
    private String fileType;

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }
}
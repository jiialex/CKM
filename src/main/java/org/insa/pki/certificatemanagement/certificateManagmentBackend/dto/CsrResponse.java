package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class CsrResponse {

    private String csr;

    public CsrResponse(String csr) {
        this.csr = csr;
    }

    public String getCsr(){
        return csr;
    }

}
package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class RenewalRequest {
    private String alias;
    private int validityDays;


    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }
    public int getValidityDays() { return validityDays; }
    public void setValidityDays(int validityDays) { this.validityDays = validityDays; }
}
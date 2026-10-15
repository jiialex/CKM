package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ChangePasswordRequest {

    @JsonProperty("currentPassword")
    private String currentPassword;

    @JsonProperty("newPassword")
    private String newPassword;

    // Default Constructor
    public ChangePasswordRequest() {}

    // Getters and Setters
    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
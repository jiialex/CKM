package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.Role;

public class SignupRequest {

    private String username;
    private String email;
    private String password;
    private String confirmPassword;
    private Role role;
    @Enumerated(EnumType.STRING)
    private CaType caType;



    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getConfirmPassword() {
        return confirmPassword;
    }

    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public CaType getCaType() {
        return caType;
    }

    public void setCaType(CaType caType) {
        this.caType = caType;
    }
}
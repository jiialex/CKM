package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

import java.time.Instant;

public class DeviceSessionResponse {
    private Long id;
    private String os;
    private String browser;
    private String ipAddress;
    private Instant expiresAt;

    public DeviceSessionResponse(Long id, String os, String browser, String ipAddress, Instant expiresAt) {
        this.id = id;
        this.os = os;
        this.browser = browser;
        this.ipAddress = ipAddress;
        this.expiresAt = expiresAt;
    }

    // Standard getters
    public Long getId() { return id; }
    public String getOs() { return os; }
    public String getBrowser() { return browser; }
    public String getIpAddress() { return ipAddress; }
    public Instant getExpiresAt() { return expiresAt; }
}
package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

import java.time.LocalDateTime;

public class ThreatEventDto {

    private String ip;
    private String country;
    private String city;
    private String reason;
    private String severity;
    private int attempts;
    private LocalDateTime detectedAt;

    public ThreatEventDto() {}

    public ThreatEventDto(
            String ip,
            String country,
            String city,
            String reason,
            String severity,
            int attempts,
            LocalDateTime detectedAt
    ) {
        this.ip = ip;
        this.country = country;
        this.city = city;
        this.reason = reason;
        this.severity = severity;
        this.attempts = attempts;
        this.detectedAt = detectedAt;
    }

    public String getIp() {
        return ip;
    }

    public String getCountry() {
        return country;
    }

    public String getCity() {
        return city;
    }

    public String getReason() {
        return reason;
    }

    public String getSeverity() {
        return severity;
    }

    public int getAttempts() {
        return attempts;
    }

    public LocalDateTime getDetectedAt() {
        return detectedAt;
    }
}
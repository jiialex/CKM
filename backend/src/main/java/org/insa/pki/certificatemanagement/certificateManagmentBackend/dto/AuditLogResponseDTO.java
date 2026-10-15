package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditEventType;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditSeverity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditStatus;

import java.time.LocalDateTime;

public class AuditLogResponseDTO {

    private Long id;

    private String username;

    private String action;

    private String target;

    private AuditStatus status;

    private AuditSeverity severity;

    private AuditEventType eventType;

    private String ip;

    private String endpoint;

    private String method;

    private String userAgent;

    private String correlationId;

    private String details;

    private Integer httpStatus;

    private LocalDateTime timestamp;

    private Long executionTimeMs;

    private Boolean integrityVerified;

    // =========================
    // Getters and Setters
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public AuditStatus getStatus() {
        return status;
    }

    public void setStatus(AuditStatus status) {
        this.status = status;
    }

    public AuditSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(AuditSeverity severity) {
        this.severity = severity;
    }

    public AuditEventType getEventType() {
        return eventType;
    }

    public void setEventType(AuditEventType eventType) {
        this.eventType = eventType;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Integer getHttpStatus() {
        return httpStatus;
    }

    public void setHttpStatus(Integer httpStatus) {
        this.httpStatus = httpStatus;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Long getExecutionTimeMs() {
        return executionTimeMs;
    }

    public void setExecutionTimeMs(Long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }

    public Boolean getIntegrityVerified() {
        return integrityVerified;
    }

    public void setIntegrityVerified(Boolean integrityVerified) {
        this.integrityVerified = integrityVerified;
    }
}

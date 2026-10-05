package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.config.annotation.Auditable;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditStatus;

import java.time.LocalDateTime;

public class AuditContext {

    private String user;
    private String action;
    private String target;


    private String ip;
    private String endpoint;
    private String method;
    private String userAgent;

    private AuditStatus status;
    private String details;
    private Integer httpStatus;

    private String correlationId;


    private String resource;
    private Auditable.Level level;

    private Long executionTimeMs;

    private LocalDateTime timestamp;

    public AuditContext() {
        this.timestamp = LocalDateTime.now();
    }



    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }

    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public AuditStatus getStatus() { return status; }
    public void setStatus(AuditStatus status) { this.status = status; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public Integer getHttpStatus() { return httpStatus; }
    public void setHttpStatus(Integer httpStatus) { this.httpStatus = httpStatus; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public String getResource() { return resource; }
    public void setResource(String resource) { this.resource = resource; }

    public Auditable.Level getLevel() { return level; }
    public void setLevel(Auditable.Level level) { this.level = level; }

    public Long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(Long executionTimeMs) { this.executionTimeMs = executionTimeMs; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
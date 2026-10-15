package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.NotificationEventType;

import java.time.LocalDateTime;

public class NotificationResponse {

    private NotificationEventType type;
    private String title;
    private String message;
    private String entityType;
    private Long entityId;
    private String alias;
    private String recipientEmail;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime expiryDate;
    private Long daysRemaining;

    public NotificationResponse() {
    }

    public NotificationResponse(
            NotificationEventType type,
            String title,
            String message,
            String entityType,
            Long entityId,
            String alias,
            String recipientEmail,
            String status,
            LocalDateTime createdAt,
            LocalDateTime expiryDate,
            Long daysRemaining
    ) {
        this.type = type;
        this.title = title;
        this.message = message;
        this.entityType = entityType;
        this.entityId = entityId;
        this.alias = alias;
        this.recipientEmail = recipientEmail;
        this.status = status;
        this.createdAt = createdAt;
        this.expiryDate = expiryDate;
        this.daysRemaining = daysRemaining;
    }

    public NotificationEventType getType() {
        return type;
    }

    public void setType(NotificationEventType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Long getDaysRemaining() {
        return daysRemaining;
    }

    public void setDaysRemaining(Long daysRemaining) {
        this.daysRemaining = daysRemaining;
    }
}

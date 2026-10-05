package org.insa.pki.certificatemanagement.certificateManagmentBackend.model;

public enum NotificationEventType {
    CERTIFICATE_ISSUED,
    CERTIFICATE_REVOKED,
    CERTIFICATE_EXPIRING_SOON,
    CERTIFICATE_EXPIRED,
    CSR_APPROVED,
    CSR_REJECTED,
    CSR_SIGNED
}

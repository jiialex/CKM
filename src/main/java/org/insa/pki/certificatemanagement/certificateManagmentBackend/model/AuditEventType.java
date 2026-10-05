package org.insa.pki.certificatemanagement.certificateManagmentBackend.model;


public enum AuditEventType {

    AUTHENTICATION,
    CERTIFICATE,
    REVOCATION,
    KEY_MANAGEMENT,
    CRL_OPERATION,
    SECURITY,
    SYSTEM,
    EXPORT,
    COMPLIANCE
}
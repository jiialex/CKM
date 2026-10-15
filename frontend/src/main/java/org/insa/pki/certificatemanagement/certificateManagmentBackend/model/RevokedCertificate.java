package org.insa.pki.certificatemanagement.certificateManagmentBackend.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "revoked_certificates")
public class RevokedCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // CERTIFICATE IDENTITY
    // =========================
    private String certificateAlias;
    private String issuerAlias;
    private String serialNumber;

    // =========================
    // REVOCATION INFO
    // =========================
    @Temporal(TemporalType.TIMESTAMP)
    private Date revocationDate;

    @Enumerated(EnumType.STRING)
    private RevocationReason reason;

    private String comment;

    private String revokedBy;

    private String correlationId;

    // =========================
    // PKI / OCSP + CRL ENHANCEMENTS
    // =========================

    /**
     * CRL number at time of revocation inclusion
     */
    private Long crlNumber;

    /**
     * Optional: when this revocation becomes effective (RFC 5280 feature)
     */
    @Temporal(TemporalType.TIMESTAMP)
    private Date invalidityDate;

    /**
     * Whether included in delta CRL in future (optional extension)
     */
    private Boolean includedInDeltaCrl = false;

    public RevokedCertificate() {}

    public RevokedCertificate(String certificateAlias,
                              String issuerAlias,
                              String serialNumber,
                              Date revocationDate,
                              RevocationReason reason) {
        this.certificateAlias = certificateAlias;
        this.issuerAlias = issuerAlias;
        this.serialNumber = serialNumber;
        this.revocationDate = revocationDate;
        this.reason = reason;
    }

    // =========================
    // GETTERS / SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCertificateAlias() {
        return certificateAlias;
    }

    public void setCertificateAlias(String certificateAlias) {
        this.certificateAlias = certificateAlias;
    }

    public String getIssuerAlias() {
        return issuerAlias;
    }

    public void setIssuerAlias(String issuerAlias) {
        this.issuerAlias = issuerAlias;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public Date getRevocationDate() {
        return revocationDate;
    }

    public void setRevocationDate(Date revocationDate) {
        this.revocationDate = revocationDate;
    }

    public RevocationReason getReason() {
        return reason;
    }

    public void setReason(RevocationReason reason) {
        this.reason = reason;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getRevokedBy() {
        return revokedBy;
    }

    public void setRevokedBy(String revokedBy) {
        this.revokedBy = revokedBy;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public Long getCrlNumber() {
        return crlNumber;
    }

    public void setCrlNumber(Long crlNumber) {
        this.crlNumber = crlNumber;
    }

    public Date getInvalidityDate() {
        return invalidityDate;
    }

    public void setInvalidityDate(Date invalidityDate) {
        this.invalidityDate = invalidityDate;
    }

    public Boolean getIncludedInDeltaCrl() {
        return includedInDeltaCrl;
    }

    public void setIncludedInDeltaCrl(Boolean includedInDeltaCrl) {
        this.includedInDeltaCrl = includedInDeltaCrl;
    }
}
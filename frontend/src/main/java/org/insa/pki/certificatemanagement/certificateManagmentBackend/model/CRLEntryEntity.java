package org.insa.pki.certificatemanagement.certificateManagmentBackend.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "certificate_crl")
public class CRLEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String caAlias;

    @Lob
    private byte[] crlData;

    @Temporal(TemporalType.TIMESTAMP)
    private Date generatedAt;

    private String generatedBy;

    private String correlationId;

    public Long getId() {
        return id;
    }

    public String getCaAlias() {
        return caAlias;
    }

    public void setCaAlias(String caAlias) {
        this.caAlias = caAlias;
    }

    public byte[] getCrlData() {
        return crlData;
    }

    public void setCrlData(byte[] crlData) {
        this.crlData = crlData;
    }

    public Date getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Date generatedAt) {
        this.generatedAt = generatedAt;
    }

    public String getGeneratedBy() {
        return generatedBy;
    }

    public void setGeneratedBy(String generatedBy) {
        this.generatedBy = generatedBy;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }
}
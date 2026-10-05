package org.insa.pki.certificatemanagement.certificateManagmentBackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "keys_metadata")
public class KeyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String alias;

    private String algorithm;

    @Column(name = "key_size")
    private Integer keySize;

    @Column(name = "curve_name")
    private String curveName;

    @Lob
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String publicKey;

    @Column(name = "is_hsm_key", nullable = false)
    private Boolean isHsmKey = true;
    private String hsmLabel;
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private String createdBy;
    @Column(name = "certificate_bound")
    private Boolean certificateBound = false;
    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }


    public Long getId() { return id; }

    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }
    private Boolean enabled = true;
    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }

    public Integer getKeySize() { return keySize; }
    public void setKeySize(Integer keySize) { this.keySize = keySize; }
    public Boolean getCertificateBound() {
        return certificateBound;
    }

    public void setCertificateBound(Boolean certificateBound) {
        this.certificateBound = certificateBound;
    }
    public String getCurveName() { return curveName; }
    public void setCurveName(String curveName) { this.curveName = curveName; }

    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }

    public Boolean getIsHsmKey() { return isHsmKey; }
    public void setIsHsmKey(Boolean hsmKey) { isHsmKey = hsmKey; }

    public String getHsmLabel() { return hsmLabel; }
    public void setHsmLabel(String hsmLabel) { this.hsmLabel = hsmLabel; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

}
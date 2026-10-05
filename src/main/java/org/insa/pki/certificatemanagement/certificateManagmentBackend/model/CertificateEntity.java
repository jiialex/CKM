package org.insa.pki.certificatemanagement.certificateManagmentBackend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "certificates")
public class CertificateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String alias;

    private String keyAlias;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String certificate;

    // =========================
    // SUBJECT
    // =========================

    private String commonName;

    private String organization;

    private String organizationalUnit;

    private String country;

    private String state;

    private String locality;

    private String email;

    @Column(length = 1000)
    private String subject;

    private String type;

    private String status;

    private String serialNumber;

    private String issuer;
    private String issuerAlias;
    private String signatureAlgorithm;

    private Boolean ca;

    private Integer pathLength;


    private LocalDateTime createdAt;

    private LocalDateTime expiryDate;
    private String certificateType;


    private String publicKeyHash;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String fingerprint;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String csrHash;

    // =========================
      private String issuedBy;

    private String correlationId;

    private String createdBy;

    // =========================
    // REVOCATION
    // =========================

    private String revokedBy;

    private LocalDateTime revokedAt;

    private String revocationReason;

    // =========================
    // EXTENSIONS
    // =========================

    @ElementCollection
    @CollectionTable(
            name = "certificate_key_usages",
            joinColumns = @JoinColumn(name = "certificate_id")
    )
    @Column(name = "key_usage")
    private List<String> keyUsages;

    @ElementCollection
    @CollectionTable(
            name = "certificate_extended_key_usages",
            joinColumns = @JoinColumn(name = "certificate_id")
    )
    @Column(name = "eku")
    private List<String> extendedKeyUsages;

    @ElementCollection
    @CollectionTable(
            name = "certificate_dns_names",
            joinColumns = @JoinColumn(name = "certificate_id")
    )
    @Column(name = "dns_name")
    private List<String> dnsNames;

    @ElementCollection
    @CollectionTable(
            name = "certificate_ip_addresses",
            joinColumns = @JoinColumn(name = "certificate_id")
    )
    @Column(name = "ip_address")
    private List<String> ipAddresses;

    @ElementCollection
    @CollectionTable(
            name = "certificate_crl_urls",
            joinColumns = @JoinColumn(name = "certificate_id")
    )
    @Column(name = "crl_url")
    private List<String> crlUrls;

    // =========================
    // GETTERS / SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public String getKeyAlias() {
        return keyAlias;
    }

    public void setKeyAlias(String keyAlias) {
        this.keyAlias = keyAlias;
    }

    public String getCertificate() {
        return certificate;
    }

    public void setCertificate(String certificate) {
        this.certificate = certificate;
    }
    public String getCertificateType() {
        return certificateType;
    }

    public void setCertificateType(String certificateType) {
        this.certificateType = certificateType;
    }
    public String getCommonName() {
        return commonName;
    }

    public void setCommonName(String commonName) {
        this.commonName = commonName;
    }
    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }
    public String getOrganization() {
        return organization;
    }

    public void setOrganization(String organization) {
        this.organization = organization;
    }

    public String getOrganizationalUnit() {
        return organizationalUnit;
    }

    public void setOrganizationalUnit(String organizationalUnit) {
        this.organizationalUnit = organizationalUnit;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getLocality() {
        return locality;
    }

    public void setLocality(String locality) {
        this.locality = locality;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }
    public String getIssuedBy() {
        return issuedBy;
    }

    public void setIssuedBy(String issuedBy) {
        this.issuedBy = issuedBy;
    }
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getIssuerAlias() {
        return issuerAlias;
    }

    public void setIssuerAlias(String issuerAlias) {
        this.issuerAlias = issuerAlias;
    }

    public String getSignatureAlgorithm() {
        return signatureAlgorithm;
    }

    public void setSignatureAlgorithm(String signatureAlgorithm) {
        this.signatureAlgorithm = signatureAlgorithm;
    }

    public Boolean getCa() {
        return ca;
    }

    public void setCa(Boolean ca) {
        this.ca = ca;
    }

    public Integer getPathLength() {
        return pathLength;
    }

    public void setPathLength(Integer pathLength) {
        this.pathLength = pathLength;
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

    public String getFingerprint() {
        return fingerprint;
    }

    public void setFingerprint(String fingerprint) {
        this.fingerprint = fingerprint;
    }

    public String getPublicKeyHash() {
        return publicKeyHash;
    }

    public void setPublicKeyHash(String publicKeyHash) {
        this.publicKeyHash = publicKeyHash;
    }

    public String getCsrHash() {
        return csrHash;
    }

    public void setCsrHash(String csrHash) {
        this.csrHash = csrHash;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getRevokedBy() {
        return revokedBy;
    }

    public void setRevokedBy(String revokedBy) {
        this.revokedBy = revokedBy;
    }

    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(LocalDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }

    public String getRevocationReason() {
        return revocationReason;
    }

    public void setRevocationReason(String revocationReason) {
        this.revocationReason = revocationReason;
    }

    public List<String> getKeyUsages() {
        return keyUsages;
    }

    public void setKeyUsages(List<String> keyUsages) {
        this.keyUsages = keyUsages;
    }

    public List<String> getExtendedKeyUsages() {
        return extendedKeyUsages;
    }

    public void setExtendedKeyUsages(List<String> extendedKeyUsages) {
        this.extendedKeyUsages = extendedKeyUsages;
    }

    public List<String> getDnsNames() {
        return dnsNames;
    }

    public void setDnsNames(List<String> dnsNames) {
        this.dnsNames = dnsNames;
    }

    public List<String> getIpAddresses() {
        return ipAddresses;
    }

    public void setIpAddresses(List<String> ipAddresses) {
        this.ipAddresses = ipAddresses;
    }

    public List<String> getCrlUrls() {
        return crlUrls;
    }

    public void setCrlUrls(List<String> crlUrls) {
        this.crlUrls = crlUrls;
    }
}
package org.insa.pki.certificatemanagement.certificateManagmentBackend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "csrs")
public class CsrEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String csrAlias;

    private String keyAlias;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String csrPem;
    private String commonName;
    private String organization;
    private String organizationalUnit;
    private String country;
    private String state;

    private String locality;

    private String email;



    private String signatureAlgorithm;



    private LocalDateTime notBefore;

    private LocalDateTime notAfter;



    private Boolean ca;

    private Integer pathLength;



    private Boolean subjectKeyIdentifier;

    private Boolean authorityKeyIdentifier;



    @Enumerated(EnumType.STRING)
    private CsrStatus status;
    private Boolean expired = false;

    private Boolean issued = false;



    private String ocspUrl;

    private String caIssuersUrl;



    private LocalDateTime createdAt;

    private String createdBy;

    @Column(length = 1000)
    private String rejectionReason;

    @ElementCollection
    @CollectionTable(
            name = "csr_key_usages",
            joinColumns = @JoinColumn(name = "csr_id")
    )
    @Column(name = "key_usage")
    private List<String> keyUsages;

    @ElementCollection
    @CollectionTable(
            name = "csr_extended_key_usages",
            joinColumns = @JoinColumn(name = "csr_id")
    )
    @Column(name = "eku")
    private List<String> extendedKeyUsages;

    @ElementCollection
    @CollectionTable(
            name = "csr_dns_names",
            joinColumns = @JoinColumn(name = "csr_id")
    )
    @Column(name = "dns_name")
    private List<String> dnsNames;

    @ElementCollection
    @CollectionTable(
            name = "csr_ip_addresses",
            joinColumns = @JoinColumn(name = "csr_id")
    )
    @Column(name = "ip_address")
    private List<String> ipAddresses;

    @ElementCollection
    @CollectionTable(
            name = "csr_crl_urls",
            joinColumns = @JoinColumn(name = "csr_id")
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

    public String getCsrAlias() {
        return csrAlias;
    }

    public void setCsrAlias(String csrAlias) {
        this.csrAlias = csrAlias;
    }

    public String getKeyAlias() {
        return keyAlias;
    }

    public void setKeyAlias(String keyAlias) {
        this.keyAlias = keyAlias;
    }

    public String getCsrPem() {
        return csrPem;
    }

    public void setCsrPem(String csrPem) {
        this.csrPem = csrPem;
    }

    public String getCommonName() {
        return commonName;
    }

    public void setCommonName(String commonName) {
        this.commonName = commonName;
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

    public String getSignatureAlgorithm() {
        return signatureAlgorithm;
    }

    public void setSignatureAlgorithm(String signatureAlgorithm) {
        this.signatureAlgorithm = signatureAlgorithm;
    }

    public LocalDateTime getNotBefore() {
        return notBefore;
    }

    public void setNotBefore(LocalDateTime notBefore) {
        this.notBefore = notBefore;
    }

    public LocalDateTime getNotAfter() {
        return notAfter;
    }

    public void setNotAfter(LocalDateTime notAfter) {
        this.notAfter = notAfter;
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

    public Boolean getSubjectKeyIdentifier() {
        return subjectKeyIdentifier;
    }

    public void setSubjectKeyIdentifier(Boolean subjectKeyIdentifier) {
        this.subjectKeyIdentifier = subjectKeyIdentifier;
    }

    public Boolean getAuthorityKeyIdentifier() {
        return authorityKeyIdentifier;
    }

    public void setAuthorityKeyIdentifier(Boolean authorityKeyIdentifier) {
        this.authorityKeyIdentifier = authorityKeyIdentifier;
    }

    public CsrStatus getStatus() {
        return status;
    }

    public void setStatus(CsrStatus status) {
        this.status = status;
    }

    public Boolean getExpired() {
        return expired;
    }

    public void setExpired(Boolean expired) {
        this.expired = expired;
    }

    public Boolean getIssued() {
        return issued;
    }

    public void setIssued(Boolean issued) {
        this.issued = issued;
    }

    public String getOcspUrl() {
        return ocspUrl;
    }

    public void setOcspUrl(String ocspUrl) {
        this.ocspUrl = ocspUrl;
    }

    public String getCaIssuersUrl() {
        return caIssuersUrl;
    }

    public void setCaIssuersUrl(String caIssuersUrl) {
        this.caIssuersUrl = caIssuersUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
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
    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
    public List<String> getCrlUrls() {
        return crlUrls;
    }

    public void setCrlUrls(List<String> crlUrls) {
        this.crlUrls = crlUrls;
    }
}
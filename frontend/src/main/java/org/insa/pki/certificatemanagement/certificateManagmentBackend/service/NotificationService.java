package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.NotificationResponse;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CertificateEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CsrEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.CsrStatus;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.NotificationEventType;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.UserEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.CertificateRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.CsrRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class NotificationService {

    private static final int EXPIRY_WARNING_DAYS = 30;

    private final CertificateRepository certificateRepository;
    private final CsrRepository csrRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public NotificationService(
            CertificateRepository certificateRepository,
            CsrRepository csrRepository,
            UserRepository userRepository,
            EmailService emailService
    ) {
        this.certificateRepository = certificateRepository;
        this.csrRepository = csrRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public List<NotificationResponse> getAllNotifications() {
        List<NotificationResponse> notifications = new ArrayList<>();
        notifications.addAll(getCertificateNotifications());
        notifications.addAll(getCsrNotifications());
        return sortNewestFirst(notifications);
    }

    public List<NotificationResponse> getMyNotifications() {
        List<NotificationResponse> notifications = new ArrayList<>();
        notifications.addAll(getMyCertificateNotifications());
        notifications.addAll(getMyCsrNotifications());
        return sortNewestFirst(notifications);
    }

    public List<NotificationResponse> getMyCertificateNotifications() {
        String username = getCurrentUsername();

        return getCertificateNotifications().stream()
                .filter(notification -> certificateRepository.findById(notification.getEntityId())
                        .map(cert -> belongsToUser(cert.getCreatedBy(), username))
                        .orElse(false))
                .toList();
    }

    public List<NotificationResponse> getMyCsrNotifications() {
        String username = getCurrentUsername();

        return getCsrNotifications().stream()
                .filter(notification -> csrRepository.findById(notification.getEntityId())
                        .map(csr -> belongsToUser(csr.getCreatedBy(), username))
                        .orElse(false))
                .toList();
    }

    public List<NotificationResponse> getCertificateNotifications() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(EXPIRY_WARNING_DAYS);

        List<NotificationResponse> notifications = new ArrayList<>();

        for (CertificateEntity cert : certificateRepository.findAll()) {
            if ("ACTIVE".equalsIgnoreCase(cert.getStatus())) {
                notifications.add(buildCertificateNotification(
                        NotificationEventType.CERTIFICATE_ISSUED,
                        cert
                ));
            }

            if ("REVOKED".equalsIgnoreCase(cert.getStatus())) {
                notifications.add(buildCertificateNotification(
                        NotificationEventType.CERTIFICATE_REVOKED,
                        cert
                ));
            }

            if (cert.getExpiryDate() == null) {
                continue;
            }

            if (cert.getExpiryDate().isBefore(now)) {
                notifications.add(buildCertificateNotification(
                        NotificationEventType.CERTIFICATE_EXPIRED,
                        cert
                ));
            } else if (cert.getExpiryDate().isBefore(threshold)
                    && !"REVOKED".equalsIgnoreCase(cert.getStatus())
                    && !"ARCHIVED".equalsIgnoreCase(cert.getStatus())) {
                notifications.add(buildCertificateNotification(
                        NotificationEventType.CERTIFICATE_EXPIRING_SOON,
                        cert
                ));
            }
        }

        return sortNewestFirst(notifications);
    }

    public List<NotificationResponse> getCsrNotifications() {
        List<NotificationResponse> notifications = new ArrayList<>();

        for (CsrEntity csr : csrRepository.findAll()) {
            if (csr.getStatus() == CsrStatus.APPROVED) {
                notifications.add(buildCsrNotification(
                        NotificationEventType.CSR_APPROVED,
                        csr
                ));
            }

            if (csr.getStatus() == CsrStatus.REJECTED) {
                notifications.add(buildCsrNotification(
                        NotificationEventType.CSR_REJECTED,
                        csr
                ));
            }

            if (csr.getStatus() == CsrStatus.SIGNED
                    || Boolean.TRUE.equals(csr.getIssued())) {
                notifications.add(buildCsrNotification(
                        NotificationEventType.CSR_SIGNED,
                        csr
                ));
            }
        }

        return sortNewestFirst(notifications);
    }

    public void notifyCertificateIssued(CertificateEntity cert) {
        sendIfRecipientExists(resolveSignupEmail(cert.getCreatedBy()), buildCertificateNotification(
                NotificationEventType.CERTIFICATE_ISSUED,
                cert
        ));
    }

    public void notifyCertificateRevoked(CertificateEntity cert) {
        sendIfRecipientExists(resolveSignupEmail(cert.getCreatedBy()), buildCertificateNotification(
                NotificationEventType.CERTIFICATE_REVOKED,
                cert
        ));
    }

    public void notifyCertificateExpiringSoon(CertificateEntity cert) {
        sendIfRecipientExists(resolveSignupEmail(cert.getCreatedBy()), buildCertificateNotification(
                NotificationEventType.CERTIFICATE_EXPIRING_SOON,
                cert
        ));
    }

    public void notifyCertificateExpired(CertificateEntity cert) {
        sendIfRecipientExists(resolveSignupEmail(cert.getCreatedBy()), buildCertificateNotification(
                NotificationEventType.CERTIFICATE_EXPIRED,
                cert
        ));
    }

    public void notifyCsrApproved(CsrEntity csr) {
        sendIfRecipientExists(resolveSignupEmail(csr.getCreatedBy()), buildCsrNotification(
                NotificationEventType.CSR_APPROVED,
                csr
        ));
    }

    public void notifyCsrRejected(CsrEntity csr) {
        sendIfRecipientExists(resolveSignupEmail(csr.getCreatedBy()), buildCsrNotification(
                NotificationEventType.CSR_REJECTED,
                csr
        ));
    }

    public void notifyCsrSigned(CsrEntity csr) {
        sendIfRecipientExists(resolveSignupEmail(csr.getCreatedBy()), buildCsrNotification(
                NotificationEventType.CSR_SIGNED,
                csr
        ));
    }

    private NotificationResponse buildCertificateNotification(
            NotificationEventType type,
            CertificateEntity cert
    ) {
        LocalDateTime eventTime = switch (type) {
            case CERTIFICATE_REVOKED -> cert.getRevokedAt();
            case CERTIFICATE_EXPIRING_SOON, CERTIFICATE_EXPIRED -> cert.getExpiryDate();
            default -> cert.getCreatedAt();
        };

        Long daysRemaining = cert.getExpiryDate() == null
                ? null
                : Duration.between(LocalDateTime.now(), cert.getExpiryDate()).toDays();

        return new NotificationResponse(
                type,
                title(type),
                certificateMessage(type, cert, daysRemaining),
                "CERTIFICATE",
                cert.getId(),
                cert.getAlias(),
                resolveSignupEmail(cert.getCreatedBy()),
                cert.getStatus(),
                eventTime,
                cert.getExpiryDate(),
                daysRemaining
        );
    }

    private NotificationResponse buildCsrNotification(
            NotificationEventType type,
            CsrEntity csr
    ) {
        return new NotificationResponse(
                type,
                title(type),
                csrMessage(type, csr),
                "CSR",
                csr.getId(),
                csr.getCsrAlias(),
                resolveSignupEmail(csr.getCreatedBy()),
                csr.getStatus() == null ? null : csr.getStatus().name(),
                csr.getCreatedAt(),
                csr.getNotAfter(),
                null
        );
    }

    private String title(NotificationEventType type) {
        return switch (type) {
            case CERTIFICATE_ISSUED -> "Certificate Issued";
            case CERTIFICATE_REVOKED -> "Certificate Revoked";
            case CERTIFICATE_EXPIRING_SOON -> "Certificate Expiring Soon";
            case CERTIFICATE_EXPIRED -> "Certificate Expired";
            case CSR_APPROVED -> "CSR Approved";
            case CSR_REJECTED -> "CSR Rejected";
            case CSR_SIGNED -> "CSR Signed";
        };
    }

    private String certificateMessage(
            NotificationEventType type,
            CertificateEntity cert,
            Long daysRemaining
    ) {
        String alias = valueOrFallback(cert.getAlias(), "certificate");

        return switch (type) {
            case CERTIFICATE_ISSUED ->
                    "Certificate '" + alias + "' was issued successfully.";
            case CERTIFICATE_REVOKED ->
                    "Certificate '" + alias + "' was revoked. Reason: "
                            + valueOrFallback(cert.getRevocationReason(), "not specified") + ".";
            case CERTIFICATE_EXPIRING_SOON ->
                    "Certificate '" + alias + "' will expire in "
                            + valueOrFallback(daysRemaining, 0L) + " day(s).";
            case CERTIFICATE_EXPIRED ->
                    "Certificate '" + alias + "' has expired.";
            default ->
                    "Certificate '" + alias + "' has a new notification.";
        };
    }

    private String csrMessage(NotificationEventType type, CsrEntity csr) {
        String alias = valueOrFallback(csr.getCsrAlias(), "CSR");

        return switch (type) {
            case CSR_APPROVED ->
                    "CSR '" + alias + "' was approved.";
            case CSR_REJECTED ->
                    "CSR '" + alias + "' was rejected. Reason: "
                            + valueOrFallback(csr.getRejectionReason(), "not specified") + ".";
            case CSR_SIGNED ->
                    "CSR '" + alias + "' was signed and a certificate was issued.";
            default ->
                    "CSR '" + alias + "' has a new notification.";
        };
    }

    private void sendIfRecipientExists(String to, NotificationResponse notification) {
        if (to == null || to.isBlank()) {
            return;
        }

        try {
            emailService.sendNotificationEmail(
                    to,
                    notification.getTitle(),
                    notification.getMessage()
            );
        } catch (Exception ex) {
            System.err.println("Failed to send notification email: " + ex.getMessage());
        }
    }

    private String resolveSignupEmail(String username) {
        if (username == null || username.isBlank()) {
            return null;
        }

        return userRepository.findByUsername(username)
                .map(UserEntity::getEmail)
                .orElse(null);
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Authenticated user is required");
        }
        return authentication.getName();
    }

    private boolean belongsToUser(String ownerUsername, String currentUsername) {
        return ownerUsername != null
                && currentUsername != null
                && ownerUsername.equalsIgnoreCase(currentUsername);
    }

    private List<NotificationResponse> sortNewestFirst(
            List<NotificationResponse> notifications
    ) {
        return notifications.stream()
                .sorted(Comparator.comparing(
                        NotificationResponse::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }

    private String valueOrFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private Long valueOrFallback(Long value, Long fallback) {
        return value == null ? fallback : value;
    }
}

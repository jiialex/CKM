package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.NotificationResponse;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','AUDITOR')")
    public ResponseEntity<List<NotificationResponse>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @GetMapping("/certificates")
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','AUDITOR')")
    public ResponseEntity<List<NotificationResponse>> getCertificateNotifications() {
        return ResponseEntity.ok(notificationService.getCertificateNotifications());
    }

    @GetMapping("/csr")
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','AUDITOR')")
    public ResponseEntity<List<NotificationResponse>> getCsrNotifications() {
        return ResponseEntity.ok(notificationService.getCsrNotifications());
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications() {
        return ResponseEntity.ok(notificationService.getMyNotifications());
    }

    @GetMapping({"/my/certificates", "/mynotificationcertificate"})
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    public ResponseEntity<List<NotificationResponse>> getMyCertificateNotifications() {
        return ResponseEntity.ok(notificationService.getMyCertificateNotifications());
    }

    @GetMapping({"/my/csr", "/mynotificationcsr"})
    @PreAuthorize("hasAnyRole('ADMIN','CA_OPERATOR','USER','AUDITOR')")
    public ResponseEntity<List<NotificationResponse>> getMyCsrNotifications() {
        return ResponseEntity.ok(notificationService.getMyCsrNotifications());
    }
}

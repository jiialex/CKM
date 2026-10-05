package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditAnalyticsDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditFilterRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditLogResponseDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.config.AuditMapper;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditLog;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditSeverity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditStatus;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.AuditRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.AuditAnalyticsService;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.AuditQueryService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;



    @RestController
    @RequestMapping("/api/audit")
    public class AuditController {

        private final AuditRepository auditRepository;
        private final AuditAnalyticsService analyticsService;
        private final AuditQueryService queryService;

        public AuditController(
                AuditRepository auditRepository,
                AuditAnalyticsService analyticsService,
                AuditQueryService queryService
        ) {
            this.auditRepository = auditRepository;
            this.analyticsService = analyticsService;
            this.queryService = queryService;
        }
        @GetMapping("/logs")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public List<AuditLogResponseDTO> getLogs() {

            return toDtos(queryService.exportRows(new AuditFilterRequest()));
        }

        @GetMapping("/logs/{id}")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public AuditLogResponseDTO getLogById(@PathVariable Long id) {

            return queryService
                    .findById(id)
                    .map(AuditMapper::toDTO)
                    .orElseThrow(() ->
                            new ResponseStatusException(HttpStatus.NOT_FOUND, "Audit log not found")
                    );
        }

        @GetMapping("/logs/user/{username}")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public List<AuditLogResponseDTO> getLogsByUser(@PathVariable String username) {

            AuditFilterRequest request = new AuditFilterRequest();
            request.setUsername(username);

            return toDtos(queryService.exportRows(request));
        }

        @GetMapping("/logs/action/{action}")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public List<AuditLogResponseDTO> getLogsByAction(@PathVariable String action) {

            AuditFilterRequest request = new AuditFilterRequest();
            request.setAction(action);

            return toDtos(queryService.exportRows(request));
        }

        @GetMapping("/logs/status/{status}")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public List<AuditLogResponseDTO> getLogsByStatus(@PathVariable AuditStatus status) {

            AuditFilterRequest request = new AuditFilterRequest();
            request.setStatus(status);

            return toDtos(queryService.exportRows(request));
        }

        @GetMapping("/logs/resource/{resource}")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public List<AuditLogResponseDTO> getLogsByResource(@PathVariable String resource) {

            AuditFilterRequest request = new AuditFilterRequest();
            request.setResource(resource);

            return toDtos(queryService.exportRows(request));
        }

        @GetMapping("/logs/target")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public List<AuditLogResponseDTO> getLogsByTarget(@RequestParam String target) {

            AuditFilterRequest request = new AuditFilterRequest();
            request.setTarget(target);

            return toDtos(queryService.exportRows(request));
        }

        @GetMapping("/logs/date-range")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public List<AuditLogResponseDTO> getLogsByDateRange(
                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
        ) {

            AuditFilterRequest request = new AuditFilterRequest();
            request.setFrom(from);
            request.setTo(to);

            return toDtos(queryService.exportRows(request));
        }

        @GetMapping("/latest")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public List<AuditLogResponseDTO> getLatestActivities(
                @RequestParam(defaultValue = "10") int limit
        ) {

            return queryService
                    .latest(limit)
                    .stream()
                    .map(AuditMapper::toDTO)
                    .toList();
        }
        // =========================
        // ANALYTICS (NEW SIEM LAYER)
        // =========================

        @GetMapping("/analytics")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public AuditAnalyticsDTO analytics() {
            return analyticsService.getAnalytics();
        }

        @GetMapping("/stats")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public Map<String, Object> getStats() {
            return analyticsService.getDashboardAnalytics();
        }

        // =========================
        // SEARCH LOGS (SIEM QUERY ENGINE)
        // =========================

        @PostMapping("/logs/search")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public List<AuditLogResponseDTO> searchLogs(
                @RequestBody AuditFilterRequest request
        ) {

            return toDtos(queryService.exportRows(request));
        }

        // =========================
        // CORRELATION TRACE
        // =========================

        @GetMapping("/correlation/{id}")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public List<AuditLogResponseDTO> getCorrelationTrace(@PathVariable String id) {

            return auditRepository
                    .findByCorrelationIdOrderByTimestampAsc(id)
                    .stream()
                    .map(AuditMapper::toDTO)
                    .toList();
        }

        // =========================
        // HIGH RISK EVENTS
        // =========================

        @GetMapping("/high-risk")
        @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
        public List<AuditLogResponseDTO> getHighRiskEvents() {

            return auditRepository
                    .findTop20BySeverityOrderByTimestampDesc(AuditSeverity.CRITICAL)
                    .stream()
                    .map(AuditMapper::toDTO)
                    .toList();
        }

        private List<AuditLogResponseDTO> toDtos(List<AuditLog> logs) {
            return logs
                    .stream()
                    .map(AuditMapper::toDTO)
                    .toList();
        }
    }

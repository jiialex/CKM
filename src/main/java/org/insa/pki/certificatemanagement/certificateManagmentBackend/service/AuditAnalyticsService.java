package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditAnalyticsDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditSeverity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditStatus;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.AuditRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuditAnalyticsService {

    private final AuditRepository repo;

    public AuditAnalyticsService(AuditRepository repo) {
        this.repo = repo;
    }

    public AuditAnalyticsDTO getAnalytics() {

        AuditAnalyticsDTO dto = new AuditAnalyticsDTO();

        Map<String, Long> status = new LinkedHashMap<>();

        repo.getStatusDistribution()
                .forEach(r ->
                        status.put(
                                String.valueOf(r[0]),
                                (Long) r[1]
                        ));

        Map<String, Long> eventTypes =
                new LinkedHashMap<>();

        repo.getEventTypeDistribution()
                .forEach(r ->
                        eventTypes.put(
                                String.valueOf(r[0]),
                                (Long) r[1]
                        ));

        Map<String, Long> users =
                new LinkedHashMap<>();

        repo.getTopUsers(PageRequest.of(0, 10))
                .getContent()
                .forEach(r ->
                        users.put(
                                String.valueOf(r[0]),
                                ((Number) r[1]).longValue()
                        ));

        Map<String, Long> endpoints =
                new LinkedHashMap<>();
        repo.getTopEndpoints(PageRequest.of(0, 10))
                .getContent()
                .forEach(r ->
                        endpoints.put(
                                String.valueOf(r[0]),
                                ((Number) r[1]).longValue()
                        ));

        dto.setStatusDistribution(status);
        dto.setEventTypeDistribution(eventTypes);
        dto.setTopUsers(users);
        dto.setTopEndpoints(endpoints);

        return dto;
    }


        public Map<String, Object> getDashboardAnalytics() {

            Map<String, Object> map = new HashMap<>();

            map.put("totalEvents", repo.count());
            map.put("failedEvents", repo.countByStatus(AuditStatus.FAILED));

            map.put("criticalEvents",
                    repo.findTop20BySeverityOrderByTimestampDesc(AuditSeverity.CRITICAL).size()
            );

            return map;
        }
    }

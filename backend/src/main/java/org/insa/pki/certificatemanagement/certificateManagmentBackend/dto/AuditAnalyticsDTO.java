package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

import java.util.Map;

public class AuditAnalyticsDTO {

    private Map<String, Long> statusDistribution;

    private Map<String, Long> eventTypeDistribution;

    private Map<String, Long> topUsers;

    private Map<String, Long> topEndpoints;

    public Map<String, Long> getStatusDistribution() {
        return statusDistribution;
    }

    public void setStatusDistribution(Map<String, Long> statusDistribution) {
        this.statusDistribution = statusDistribution;
    }

    public Map<String, Long> getEventTypeDistribution() {
        return eventTypeDistribution;
    }

    public void setEventTypeDistribution(Map<String, Long> eventTypeDistribution) {
        this.eventTypeDistribution = eventTypeDistribution;
    }

    public Map<String, Long> getTopUsers() {
        return topUsers;
    }

    public void setTopUsers(Map<String, Long> topUsers) {
        this.topUsers = topUsers;
    }

    public Map<String, Long> getTopEndpoints() {
        return topEndpoints;
    }

    public void setTopEndpoints(Map<String, Long> topEndpoints) {
        this.topEndpoints = topEndpoints;
    }
}
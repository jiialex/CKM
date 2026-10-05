package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public class AuditStatsDTO {


    private long totalEvents;

    private long failedActions;

    private long revocationsToday;

    private long crlGenerated;

    public long getTotalEvents() {
        return totalEvents;
    }

    public void setTotalEvents(long totalEvents) {
        this.totalEvents = totalEvents;
    }

    public long getFailedActions() {
        return failedActions;
    }

    public void setFailedActions(long failedActions) {
        this.failedActions = failedActions;
    }

    public long getRevocationsToday() {
        return revocationsToday;
    }

    public void setRevocationsToday(long revocationsToday) {
        this.revocationsToday = revocationsToday;
    }

    public long getCrlGenerated() {
        return crlGenerated;
    }

    public void setCrlGenerated(long crlGenerated) {
        this.crlGenerated = crlGenerated;
    }


}

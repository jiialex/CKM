package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

import java.util.List;

public class AuditPagedResponseDTO {

    private List<AuditLogResponseDTO> content;

    private long totalElements;

    private int totalPages;

    private int page;

    private int size;

    private boolean first;

    private boolean last;

    // =========================
    // Getters and Setters
    // =========================

    public List<AuditLogResponseDTO> getContent() {
        return content;
    }

    public void setContent(List<AuditLogResponseDTO> content) {
        this.content = content;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public boolean isFirst() {
        return first;
    }

    public void setFirst(boolean first) {
        this.first = first;
    }

    public boolean isLast() {
        return last;
    }

    public void setLast(boolean last) {
        this.last = last;
    }
}
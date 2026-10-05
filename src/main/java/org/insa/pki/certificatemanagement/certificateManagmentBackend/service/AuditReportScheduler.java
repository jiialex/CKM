package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class AuditReportScheduler {

    private final AuditPdfExportService pdfService;

    public AuditReportScheduler(AuditPdfExportService pdfService) {
        this.pdfService = pdfService;
    }

    @Scheduled(cron = "0 0 1 * * *")
    public void generateDailyReport() {

        System.out.println("📊 Generating daily audit report...");

        byte[] pdf = pdfService.exportPdf();

        // TODO: save to disk or S3

        System.out.println("✅ Daily audit report generated: " + LocalDate.now());
    }
}
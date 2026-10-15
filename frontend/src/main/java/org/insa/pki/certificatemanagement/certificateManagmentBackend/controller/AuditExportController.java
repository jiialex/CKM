package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.config.AuditSpecification;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditFilterRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.AuditRepository;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.AuditExportService;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.AuditPdfExportService;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.PrintWriter;

@RestController
@RequestMapping("/api/audit/export")
public class AuditExportController {

    private final AuditExportService csvService;
    private final AuditPdfExportService pdfService;
    private final AuditRepository auditRepository;

    public AuditExportController(AuditExportService csvService,
                                 AuditPdfExportService pdfService,AuditRepository auditRepository) {
        this.csvService = csvService;
        this.pdfService = pdfService;
        this.auditRepository=auditRepository;
    }



    @PostMapping("/csv/stream")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
    public void streamCsv(HttpServletResponse response,
                          @RequestBody AuditFilterRequest req) throws Exception {

        response.setContentType("text/csv;charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=audit-stream.csv");

        PrintWriter writer = response.getWriter();
        writer.println("id,username,action,target,ip,status,timestamp");

        auditRepository.findAll(
                        AuditSpecification.filter(req),
                        Sort.by(Sort.Direction.DESC, "timestamp")
                )
                .forEach(log -> {
                    writer.printf("%d,%s,%s,%s,%s,%s,%s%n",
                            log.getId(),
                            csv(log.getUsername()),
                            csv(log.getAction()),
                            csv(log.getTarget()),
                            csv(log.getIp()),
                            csv(log.getStatus()),
                            csv(log.getTimestamp())
                    );
                    writer.flush();
                });
    }

    @GetMapping("/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
    public ResponseEntity<byte[]> exportPdf() {

        byte[] data = pdfService.exportPdf(new AuditFilterRequest());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=audit-log.pdf")
                .header(HttpHeaders.CONTENT_TYPE,
                        MediaType.APPLICATION_PDF_VALUE)
                .body(data);
    }

    @PostMapping("/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
    public ResponseEntity<byte[]> exportFilteredPdf(
            @RequestBody(required = false) AuditFilterRequest req
    ) {

        byte[] data = pdfService.exportPdf(req);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=audit-log.pdf")
                .header(HttpHeaders.CONTENT_TYPE,
                        MediaType.APPLICATION_PDF_VALUE)
                .body(data);
    }

    @PostMapping("/csv")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
    public ResponseEntity<byte[]> exportCsv(
            @RequestBody(required = false) AuditFilterRequest req
    ) {

        byte[] data = csvService.exportCsv(req);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=audit.csv")
                .header(HttpHeaders.CONTENT_TYPE,
                        "text/csv;charset=UTF-8")
                .body(data);
    }

    @GetMapping("/csv")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
    public ResponseEntity<byte[]> exportCsv() {

        byte[] data = csvService.exportCsv(new AuditFilterRequest());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=audit.csv")
                .header(HttpHeaders.CONTENT_TYPE,
                        "text/csv;charset=UTF-8")
                .body(data);
    }

    private String csv(Object value) {
        if (value == null) {
            return "";
        }

        String text = String.valueOf(value).replace("\"", "\"\"");
        if (text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
            return "\"" + text + "\"";
        }

        return text;
    }
}

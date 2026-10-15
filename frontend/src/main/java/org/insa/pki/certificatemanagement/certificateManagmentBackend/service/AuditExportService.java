package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditFilterRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditLog;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class AuditExportService {

    private final AuditQueryService queryService;

    public AuditExportService(AuditQueryService queryService) {
        this.queryService = queryService;
    }

    public byte[] exportCsv(AuditFilterRequest req) {

        List<AuditLog> logs = queryService.exportRows(req);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8);

        writer.println("id,username,action,target,eventType,severity,ip,endpoint,method,status,httpStatus,executionTimeMs,correlationId,timestamp,details,integrityVerified");

        for (AuditLog log : logs) {

            writer.printf(
                    "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s%n",
                    log.getId(),
                    csv(log.getUsername()),
                    csv(log.getAction()),
                    csv(log.getTarget()),
                    csv(log.getEventType()),
                    csv(log.getSeverity()),
                    csv(log.getIp()),
                    csv(log.getEndpoint()),
                    csv(log.getMethod()),
                    csv(log.getStatus()),
                    csv(log.getHttpStatus()),
                    csv(log.getExecutionTimeMs()),
                    csv(log.getCorrelationId()),
                    csv(log.getTimestamp()),
                    csv(log.getDetails()),
                    csv(log.getIntegrityVerified())
            );
        }

        writer.flush();

        return out.toByteArray();
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

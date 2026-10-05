package org.insa.pki.certificatemanagement.certificateManagmentBackend.config;


import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditLogResponseDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.AuditLog;
import org.springframework.stereotype.Component;

@Component
public class AuditMapper {

    public static AuditLogResponseDTO toDTO(AuditLog log) { //This is the method name.It means:Convert something to a DTO.
        //auditLogResponseDTO is the object that is intended to carry audit-log information toward the API/client.

        AuditLogResponseDTO dto = new AuditLogResponseDTO();

        dto.setId(log.getId());
        dto.setUsername(log.getUsername());
        dto.setAction(log.getAction());
        dto.setTarget(log.getTarget()); //tells what the operation was performed against.
        dto.setStatus(log.getStatus());
        dto.setSeverity(log.getSeverity()); //mapper takes the severity from the audit record and puts it into the response DTO.
        dto.setEventType(log.getEventType());
        dto.setIp(log.getIp());
        dto.setEndpoint(log.getEndpoint());
        dto.setCorrelationId(log.getCorrelationId());
        dto.setDetails(log.getDetails());
        dto.setTimestamp(log.getTimestamp());
        dto.setIntegrityVerified(log.getIntegrityVerified());
        dto.setExecutionTimeMs(log.getExecutionTimeMs());
        dto.setMethod(log.getMethod());
        dto.setUserAgent(log.getUserAgent());
        dto.setHttpStatus(log.getHttpStatus());

        return dto;
    }
}

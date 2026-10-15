package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.AuditLogResponseDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class AuditRealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public AuditRealtimePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(AuditLogResponseDTO dto) {
        messagingTemplate.convertAndSend("/topic/audit-stream", dto);
    }
}
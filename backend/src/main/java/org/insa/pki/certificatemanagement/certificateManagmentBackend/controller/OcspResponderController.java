package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.OcspResponderService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ocsp")
public class OcspResponderController {

    private final OcspResponderService ocspResponderService;

    public OcspResponderController(OcspResponderService ocspResponderService) {
        this.ocspResponderService = ocspResponderService;
    }

    /**
     * REAL OCSP ENDPOINT (RFC 6960)
     * Accepts binary OCSPRequest and returns binary OCSPResponse
     */
    @PostMapping
    public ResponseEntity<byte[]> handleOcspRequest(
            @RequestBody byte[] requestBytes
    ) throws Exception {

        byte[] responseBytes =
                ocspResponderService.processOcspRequest(requestBytes);

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType("application/ocsp-response")
                )
                .header(
                        HttpHeaders.CONTENT_LENGTH,
                        String.valueOf(responseBytes.length)
                )
                .body(responseBytes);
    }
}
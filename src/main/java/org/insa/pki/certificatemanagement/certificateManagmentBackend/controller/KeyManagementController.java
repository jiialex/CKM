package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.config.annotation.Auditable;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.KeyImportRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.KeyEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.KeyManagementService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
@RestController
@RequestMapping("/api/keys/manage")
public class KeyManagementController {

    private final KeyManagementService service;

    public KeyManagementController(KeyManagementService service) {
        this.service = service;
    }

    @GetMapping
    public List<KeyEntity> listAllKeys() throws Exception {
        return service.listAllKeys();
    }
    @GetMapping("/{alias}")
    public KeyEntity getKeyDetails(@PathVariable String alias) {
        return service.getKeyDetails(alias);
    }
    @DeleteMapping("/{alias}")
    public String deleteKey(
            @PathVariable String alias,
            @RequestParam String pin
    ) throws Exception {
        service.deleteKey(alias, pin);
        return "Key deleted: " + alias;
    }
    @PostMapping("/{alias}/disable")
    public String disable(@PathVariable String alias) {
        service.disableKey(alias);
        return "Key disabled";
    }
    @PostMapping("/import")
    public String importKey(
            @RequestPart("file") MultipartFile file,
            @RequestPart("request") KeyImportRequest request
    ) throws Exception {

        service.importKey(file, request);

        return "Key imported successfully";
    }
    @PostMapping("/{alias}/enable")
    public String enable(@PathVariable String alias) {
        service.enableKey(alias);
        return "Key enabled";
    }
    @PostMapping("/rotate/{alias}")
    public String rotateKey(
            @PathVariable String alias,
            @RequestParam String pin
    ) throws Exception {
        return service.rotateKey(alias, pin);
    }

    @GetMapping("/export/public/{alias}")
    public String exportPublic(@PathVariable String alias) {
        return service.exportPublicKey(alias);
    }
}
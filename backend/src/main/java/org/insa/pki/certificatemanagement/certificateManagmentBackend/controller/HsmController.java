package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.KeyRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.KeyEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.HsmService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hsm")
public class HsmController {

    private final HsmService hsmService;

    public HsmController(HsmService hsmService) {
        this.hsmService = hsmService;
    }

    @PostMapping("/generate")
    public String generate(@RequestBody KeyRequest request) throws Exception {
        return hsmService.generateKey(request);
    }

    @GetMapping("/my-keys")
    public List<KeyEntity> getMyKeys() {
        return hsmService.getMyKeys();
    }
}

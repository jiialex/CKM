package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.config.annotation.Auditable;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.UserEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;

    public AdminController(AuthService authService) {
        this.authService = authService;
    }



    @GetMapping("/pending-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserEntity>> getPendingUsers() {

        return ResponseEntity.ok(authService.getPendingUsers());
    }


    @PostMapping("/approve/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Auditable(
            action = "APPROVE_USER",
            resource = "USER",
            level = Auditable.Level.CRITICAL
    )
    public ResponseEntity<?> approve(
            @PathVariable Long id,
            Principal principal
    ) {

        authService.approveUser(id, principal.getName());

        return ResponseEntity.ok("User approved");
    }



    @PostMapping("/reject/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Auditable(
            action = "REJECT_USER",
            resource = "USER",
            level = Auditable.Level.CRITICAL
    )
    public ResponseEntity<?> reject(
            @PathVariable Long id,
            Principal principal
    ) {

        authService.rejectUser(id, principal.getName());

        return ResponseEntity.ok("User rejected and removed");
    }
}
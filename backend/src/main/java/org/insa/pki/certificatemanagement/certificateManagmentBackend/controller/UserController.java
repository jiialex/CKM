package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;


import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.UserDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.user.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    // =========================================
    // CONSTRUCTOR
    // =========================================

    public UserController(UserService userService) {
        this.userService = userService;
    }


    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {

        return ResponseEntity.ok(
                userService.getAllUsers()
        );
    }



    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        System.out.println("🔴 DELETE request received for user ID: " + id);  // ← Add this

        try {
            userService.deleteUser(id);
            System.out.println("✅ User " + id + " deleted successfully");
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("❌ Delete failed for ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
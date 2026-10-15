package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.ChangePasswordRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.DeviceSessionResponse;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.ProfileUpdateRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.UserProfileResponse;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.AuthService;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.user.UserProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.security.Principal; // <-- Add this import

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    private final UserProfileService profileService;
    private final AuthService authService;



    public UserProfileController(UserProfileService profileService,AuthService authService) {

        this.profileService = profileService;
        this.authService = authService;
    }

    // GET Profile
    @GetMapping
    public ResponseEntity<UserProfileResponse> getProfile() {
        return ResponseEntity.ok(profileService.getProfile());
    }

    // UPDATE Profile (email + username for admin)

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody ProfileUpdateRequest request) {
        boolean usernameChanged = profileService.updateProfile(request);

        if (usernameChanged) {
            return ResponseEntity.ok(Map.of(
                    "message", "Username updated. Please login again.",
                    "logout", true
            ));
        }

        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }
// Inside ProfileController.java

    @GetMapping("/devices")
    public ResponseEntity<List<DeviceSessionResponse>> getUserDevices(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Use principal.getName() directly instead of userDetails.getUsername()
        var activeTokens = authService.getActiveDevicesForUser(principal.getName());

        List<DeviceSessionResponse> response = activeTokens.stream()
                .map(t -> new DeviceSessionResponse(
                        t.getId(),
                        t.getOs() != null ? t.getOs() : "Unknown OS",
                        t.getBrowser() != null ? t.getBrowser() : "Unknown Browser",
                        t.getIpAddress() != null ? t.getIpAddress() : "0.0.0.0",
                        t.getExpiryDate()
                ))
                .toList();

        return ResponseEntity.ok(response);
    }
    // CHANGE PASSWORD
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        profileService.changePassword(request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}
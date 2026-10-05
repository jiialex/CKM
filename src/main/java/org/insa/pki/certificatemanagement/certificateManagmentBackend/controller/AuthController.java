package org.insa.pki.certificatemanagement.certificateManagmentBackend.controller;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.config.annotation.Auditable;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.ForgotPasswordRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.LoginRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.ResetPasswordRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.SignupRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Auditable(action = "LOGIN", resource = "USER", level = Auditable.Level.HIGH)
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest req) {
        Map<String, String> tokens = authService.login(req.getUsername(), req.getPassword());
        return ResponseEntity.ok(tokens);
    }

    @PostMapping("/signup")
    @Auditable(action = "SIGNUP", resource = "USER", level = Auditable.Level.MEDIUM)
    public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
        Map<String, String> result = authService.signup(req);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/logout")
    @Auditable(action = "LOGOUT", resource = "USER", level = Auditable.Level.MEDIUM)
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String header) {
        String token = header.replace("Bearer ", "");
        authService.logout(token);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> req) {
        String refreshToken = req.get("refreshToken");
        Map<String, String> tokens = authService.refresh(refreshToken);
        return ResponseEntity.ok(tokens);
    }

    // ==================== NEW: FORGOT PASSWORD ====================
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        authService.requestPasswordReset(req.email());
        return ResponseEntity.ok(Map.of(
                "message", "If an account exists, a reset link has been sent to your email."
        ));
    }

    // ==================== NEW: RESET PASSWORD ====================
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
        if (!req.newPassword().equals(req.confirmPassword())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Passwords do not match"));
        }

        authService.resetPassword(req.token(), req.newPassword());
        return ResponseEntity.ok(Map.of("message", "Password reset successful. Please login."));
    }
}

package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

public record ResetPasswordRequest(String token, String newPassword, String confirmPassword) {}
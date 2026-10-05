package org.insa.pki.certificatemanagement.certificateManagmentBackend.service.user;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.ChangePasswordRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.ProfileUpdateRequest;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.UserProfileResponse;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.Role;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.UserEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private UserEntity getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    public UserProfileResponse getProfile() {
        UserEntity user = getCurrentUser();
        UserProfileResponse dto = new UserProfileResponse();
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setMustChangePassword(user.isMustChangePassword());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setLastLogin(user.getLastLogin());
        return dto;
    }

    // Change return type from void to boolean (returns true if username changed)
    public boolean updateProfile(ProfileUpdateRequest request) {
        UserEntity user = getCurrentUser();
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean usernameChanged = false;

        if (isAdmin && "admin".equals(user.getUsername()) &&
                (request.username() != null || request.email() != null)) {
            userRepository.findByUsername("admin").ifPresent(defaultAdmin -> {
                if (!defaultAdmin.getId().equals(user.getId())) {
                    defaultAdmin.setEnabled(false);
                    defaultAdmin.setApproved(false);
                    userRepository.save(defaultAdmin);
                }
            });
        }

        if (isAdmin && request.username() != null && !request.username().trim().isBlank()) {
            String newUsername = request.username().trim();
            if (!newUsername.equals(user.getUsername())) {
                if (userRepository.findByUsername(newUsername).isPresent()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already taken");
                }
                user.setUsername(newUsername);
                usernameChanged = true;
            }
        }

        if (request.email() != null && !request.email().trim().isBlank()) {
            String newEmail = request.email().trim();
            if (!newEmail.equals(user.getEmail())) {
                if (userRepository.findByEmail(newEmail).isPresent()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");
                }
                user.setEmail(newEmail);
            }
        }

        userRepository.save(user);
        return usernameChanged; // Return status instead of throwing an exception
    }
    public void changePassword(ChangePasswordRequest request) {
        UserEntity user = getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);

        userRepository.save(user);
    }
}
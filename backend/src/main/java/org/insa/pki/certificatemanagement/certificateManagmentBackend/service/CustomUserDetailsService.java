package org.insa.pki.certificatemanagement.certificateManagmentBackend.service;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.UserEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.UserRepository;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository repo;

    public CustomUserDetailsService(UserRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {

        UserEntity user = repo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!user.isEnabled()) {
            throw new DisabledException("User account is disabled");
        }

        if (!user.isApproved()) {
            throw new LockedException("Account pending admin approval");
        }

        return User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .build();
    }
}
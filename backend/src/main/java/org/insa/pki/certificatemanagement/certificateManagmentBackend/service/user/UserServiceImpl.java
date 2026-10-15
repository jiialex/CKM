package org.insa.pki.certificatemanagement.certificateManagmentBackend.service.user;

import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.UserDTO;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.model.UserEntity;
import org.insa.pki.certificatemanagement.certificateManagmentBackend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;


    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }



    @Override
    public List<UserDTO> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }


    @Override
    public void deleteUser(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> {
                    System.err.println("User not found: " + id);
                    return new RuntimeException("User not found with id: " + id);
                });

        System.out.println("Deleting user: " + user.getUsername() + " (ID: " + id + ")");
        userRepository.delete(user);
        System.out.println("Delete completed for user ID: " + id);
    }

    // =========================================
    // DTO MAPPER
    // =========================================

    private UserDTO mapToDTO(UserEntity user) {

        UserDTO dto = new UserDTO();

        dto.setId(user.getId());

        dto.setUsername(user.getUsername());

        dto.setEmail(user.getEmail());

        dto.setRole(user.getRole().name());

        dto.setEnabled(user.isEnabled());

        dto.setApproved(user.isApproved());

        dto.setLastLogin(user.getLastLogin());

        dto.setCreatedAt(user.getCreatedAt());

        return dto;
    }
}
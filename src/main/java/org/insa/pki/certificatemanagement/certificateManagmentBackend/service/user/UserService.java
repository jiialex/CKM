package org.insa.pki.certificatemanagement.certificateManagmentBackend.service.user;


import org.insa.pki.certificatemanagement.certificateManagmentBackend.dto.UserDTO;

import java.util.List;

public interface UserService {

    List<UserDTO> getAllUsers();

    void deleteUser(Long id);
}
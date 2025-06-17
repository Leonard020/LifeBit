package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.UserDTO;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private UserDTO convertToDTO(User user) {
        return new UserDTO(
            user.getUserId().toString(),
            user.getPasswordHash(),
            user.getEmail(),
            user.getNickname(),
            user.getRole().name()
        );
    }

    public void deleteUserById(Long userId) {
        userRepository.deleteById(userId);
    }
} 
package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.LoginRequest;
import com.lifebit.coreapi.dto.SignUpRequest;
import com.lifebit.coreapi.dto.UserProfileUpdateRequest;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory!", e);
        }
    }

    @Transactional
    public User signUp(SignUpRequest request) {
        try {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("이미 사용 중인 이메일입니다.");
            }
            if (userRepository.existsByNickname(request.getNickname())) {
                throw new RuntimeException("이미 사용 중인 닉네임입니다.");
            }

            User user = new User();
            user.setEmail(request.getEmail());
            user.setNickname(request.getNickname());
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setUuid(java.util.UUID.randomUUID());
            user.setCreatedAt(java.time.LocalDateTime.now());
            user.setUpdatedAt(java.time.LocalDateTime.now());
            
            User savedUser = userRepository.save(user);

            log.info("회원가입 후 시스템 알림 처리 시작: userId={}", savedUser.getUserId());
            notificationService.markAllSystemNotificationsAsUnreadForUser(savedUser.getUserId());
            log.info("회원가입 후 시스템 알림 처리 완료: userId={}", savedUser.getUserId());

            return savedUser;
        } catch (Exception e) {
            throw new RuntimeException("회원가입 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Transactional(readOnly = false)
    public User login(LoginRequest request) {
        try {
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

            if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                throw new RuntimeException("비밀번호가 일치하지 않습니다.");
            }

            user.setLastVisited(java.time.LocalDateTime.now());
            userRepository.save(user);

            return user;
        } catch (Exception e) {
            throw new RuntimeException("로그인 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 사용자 ID로 사용자 정보 조회
     */
    @Transactional(readOnly = true)
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));
    }

    /**
     * 사용자 프로필 정보 업데이트
     */
    @Transactional
    public User updateUserProfile(Long userId, UserProfileUpdateRequest updateData, MultipartFile profileImage) {
        User user = getUserById(userId);

        if (updateData.getNickname() != null) {
            String nickname = updateData.getNickname();
            if (!user.getNickname().equals(nickname) && userRepository.existsByNickname(nickname)) {
                throw new RuntimeException("이미 사용 중인 닉네임입니다.");
            }
            user.setNickname(nickname);
        }

        if (updateData.getHeight() != null) {
            user.setHeight(updateData.getHeight());
        }

        if (updateData.getWeight() != null) {
            user.setWeight(updateData.getWeight());
        }

        if (updateData.getAge() != null) {
            user.setAge(updateData.getAge());
        }

        if (updateData.getGender() != null) {
            user.setGender(updateData.getGender());
        }

        if (updateData.getPassword() != null && !updateData.getPassword().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(updateData.getPassword()));
        }

        if (updateData.getRemoveProfileImage() != null && updateData.getRemoveProfileImage()) {
            user.setProfileImageUrl(null);
        } else if (profileImage != null && !profileImage.isEmpty()) {
            try {
                String fileName = UUID.randomUUID().toString() + "_" + profileImage.getOriginalFilename();
                Path destinationFile = Paths.get(uploadDir).resolve(Paths.get(fileName)).normalize().toAbsolutePath();

                if (!destinationFile.getParent().equals(Paths.get(uploadDir).toAbsolutePath())) {
                    throw new RuntimeException("Cannot store file outside current directory.");
                }

                try (InputStream inputStream = profileImage.getInputStream()) {
                    Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
                }

                user.setProfileImageUrl("/" + uploadDir + fileName);

            } catch (IOException e) {
                throw new RuntimeException("Failed to store file.", e);
            }
        }

        return userRepository.save(user);
    }

    /**
     * 사용자 계정 삭제
     */
    @Transactional
    public void deleteUser(Long userId) {
        User user = getUserById(userId);
        userRepository.delete(user);
    }

    /**
     * 비밀번호 검증
     */
    @Transactional(readOnly = true)
    public boolean verifyPassword(Long userId, String password) {
        User user = getUserById(userId);
        if (user.getPasswordHash() == null) {
            // Social login user: allow access without password
            return true;
        }
        return passwordEncoder.matches(password, user.getPasswordHash());
    }
} 
package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.LoginRequest;
import com.lifebit.coreapi.dto.SignUpRequest;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User signUp(SignUpRequest request) {
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
        // @PrePersist에서 uuid, role, timestamps 자동 설정됨
        
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }

        return user;
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
    public User updateUserProfile(Long userId, Map<String, Object> updateData) {
        User user = getUserById(userId);

        // 업데이트 가능한 필드들만 처리
        if (updateData.containsKey("nickname")) {
            String nickname = (String) updateData.get("nickname");
            if (!user.getNickname().equals(nickname) && userRepository.existsByNickname(nickname)) {
                throw new RuntimeException("이미 사용 중인 닉네임입니다.");
            }
            user.setNickname(nickname);
        }

        if (updateData.containsKey("height")) {
            Object heightObj = updateData.get("height");
            if (heightObj != null) {
                BigDecimal height = new BigDecimal(heightObj.toString());
                user.setHeight(height);
            }
        }

        if (updateData.containsKey("weight")) {
            Object weightObj = updateData.get("weight");
            if (weightObj != null) {
                BigDecimal weight = new BigDecimal(weightObj.toString());
                user.setWeight(weight);
            }
        }

        if (updateData.containsKey("age")) {
            Object ageObj = updateData.get("age");
            if (ageObj != null) {
                Integer age = Integer.parseInt(ageObj.toString());
                user.setAge(age);
            }
        }

        if (updateData.containsKey("gender")) {
            String gender = (String) updateData.get("gender");
            user.setGender(gender);
        }

        return userRepository.save(user);
    }
} 
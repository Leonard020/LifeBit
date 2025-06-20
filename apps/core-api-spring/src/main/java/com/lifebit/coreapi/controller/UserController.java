package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.UserProfileUpdateRequest;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.security.JwtTokenProvider;
import com.lifebit.coreapi.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final JwtTokenProvider tokenProvider;

    /**
     * 현재 로그인한 사용자의 프로필 정보 조회
     * JWT 토큰에서 사용자 ID를 추출하여 사용자 정보 반환
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            // Bearer 토큰에서 JWT 추출
            String token = authHeader.replace("Bearer ", "");
            Long userId = tokenProvider.getUserIdFromToken(token);
            
            // 사용자 정보 조회
            User user = userService.getUserById(userId);
            
            // 응답 데이터 구성 (비밀번호 제외)
            Map<String, Object> response = new HashMap<>();
            response.put("userId", user.getUserId());
            response.put("email", user.getEmail());
            response.put("nickname", user.getNickname());
            response.put("profileImageUrl", user.getProfileImageUrl());
            response.put("height", user.getHeight());
            response.put("weight", user.getWeight());
            response.put("age", user.getAge());
            response.put("gender", user.getGender());
            response.put("role", user.getRole());
            response.put("createdAt", user.getCreatedAt());
            response.put("updatedAt", user.getUpdatedAt());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "사용자 정보를 조회할 수 없습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 사용자 프로필 정보 업데이트
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestPart("updateData") UserProfileUpdateRequest updateData,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {
        try {
            // Bearer 토큰에서 JWT 추출
            String token = authHeader.replace("Bearer ", "");
            Long userId = tokenProvider.getUserIdFromToken(token);
            
            // 사용자 정보 업데이트
            User updatedUser = userService.updateUserProfile(userId, updateData, profileImage);
            
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("userId", updatedUser.getUserId());
            response.put("email", updatedUser.getEmail());
            response.put("nickname", updatedUser.getNickname());
            response.put("profileImageUrl", updatedUser.getProfileImageUrl());
            response.put("height", updatedUser.getHeight());
            response.put("weight", updatedUser.getWeight());
            response.put("age", updatedUser.getAge());
            response.put("gender", updatedUser.getGender());
            response.put("updatedAt", updatedUser.getUpdatedAt());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "사용자 정보를 업데이트할 수 없습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 사용자 계정 삭제
     */
    @DeleteMapping("/profile")
    public ResponseEntity<?> deleteUserProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = tokenProvider.getUserIdFromToken(token);
            userService.deleteUser(userId);
            return ResponseEntity.ok(Map.of("message", "사용자 계정이 성공적으로 삭제되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "사용자 계정 삭제에 실패했습니다: " + e.getMessage()));
        }
    }
} 
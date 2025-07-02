package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.service.AchievementService;
import com.lifebit.coreapi.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
@Slf4j
public class AchievementController {
    
    private final AchievementService achievementService;
    private final JwtTokenProvider jwtTokenProvider;
    
    /**
     * 사용자의 업적 목록을 조회합니다.
     */
    @GetMapping("/user")
    public ResponseEntity<?> getUserAchievements(
            @RequestParam Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // 사용자 권한 검증
            if (userDetails == null || !userDetails.getUsername().equals(userId.toString())) {
                return ResponseEntity.status(403).body(Map.of("error", "권한이 없습니다."));
            }
            
            var achievements = achievementService.getUserAchievements(userId);
            return ResponseEntity.ok(achievements);
        } catch (Exception e) {
            log.error("Failed to get user achievements", e);
            return ResponseEntity.badRequest().body(Map.of("error", "업적 조회에 실패했습니다."));
        }
    }
    
    /**
     * 사용자의 업적을 초기화합니다.
     */
    @PostMapping("/initialize")
    public ResponseEntity<?> initializeUserAchievements(
            @RequestParam Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // 사용자 권한 검증
            if (userDetails == null || !userDetails.getUsername().equals(userId.toString())) {
                return ResponseEntity.status(403).body(Map.of("error", "권한이 없습니다."));
            }
            
            achievementService.initializeUserAchievements(userId);
            return ResponseEntity.ok(Map.of("message", "업적이 초기화되었습니다."));
        } catch (Exception e) {
            log.error("Failed to initialize user achievements", e);
            return ResponseEntity.badRequest().body(Map.of("error", "업적 초기화에 실패했습니다."));
        }
    }
    
    /**
     * 특정 업적을 달성 처리합니다.
     */
    @PostMapping("/complete")
    public ResponseEntity<?> completeAchievement(
            @RequestParam Long userId,
            @RequestParam String achievementTitle,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // 사용자 권한 검증
            if (userDetails == null || !userDetails.getUsername().equals(userId.toString())) {
                return ResponseEntity.status(403).body(Map.of("error", "권한이 없습니다."));
            }
            
            achievementService.completeAchievement(userId, achievementTitle);
            return ResponseEntity.ok(Map.of(
                "message", "업적이 달성되었습니다.",
                "achievementTitle", achievementTitle,
                "rankingUpdated", true
            ));
        } catch (Exception e) {
            log.error("Failed to complete achievement", e);
            return ResponseEntity.badRequest().body(Map.of("error", "업적 달성 처리에 실패했습니다."));
        }
    }
} 
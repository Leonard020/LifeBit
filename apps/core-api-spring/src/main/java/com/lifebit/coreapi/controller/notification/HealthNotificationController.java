package com.lifebit.coreapi.controller.notification;

import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.service.notification.HealthNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/health-notifications")
@RequiredArgsConstructor
public class HealthNotificationController {
    
    private final HealthNotificationService healthNotificationService;

    // DTO 클래스들
    @Data
    public static class HealthWarningRequest {
        private String message;
    }

    @Data
    public static class GoalAchievementRequest {
        private String goalType;
        private String message;
    }

    @Data
    public static class HealthMonitoringResponse {
        private boolean success;
        private int notificationsCreated;
        private String message;
        private String error;
    }

    /**
     * 사용자의 건강 상태를 모니터링하고 알림 생성
     */
    @PostMapping("/monitor")
    public ResponseEntity<HealthMonitoringResponse> monitorHealthStatus(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // UserDetails에서 사용자 ID 추출
            Long userId = Long.parseLong(userDetails.getUsername());
            
            Map<String, Object> result = healthNotificationService.monitorUserHealth(userId);
            
            HealthMonitoringResponse response = new HealthMonitoringResponse();
            response.setSuccess((Boolean) result.get("success"));
            response.setNotificationsCreated((Integer) result.get("notificationsCreated"));
            response.setMessage((String) result.get("message"));
            response.setError((String) result.get("error"));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            HealthMonitoringResponse response = new HealthMonitoringResponse();
            response.setSuccess(false);
            response.setError("건강 상태 모니터링 실패");
            response.setMessage(e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 과도한 운동 경고 알림 생성
     */
    @PostMapping("/exercise-warning")
    public ResponseEntity<Map<String, String>> createExerciseWarning(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody HealthWarningRequest request) {
        try {
            Long userId = Long.parseLong(userDetails.getUsername());
            healthNotificationService.sendExerciseWarningNotification(userId, request.getMessage());
            return ResponseEntity.ok(Map.of("message", "운동 경고 알림이 생성되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "운동 경고 알림 생성 실패",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 영양소 불균형 알림 생성
     */
    @PostMapping("/nutrition-warning")
    public ResponseEntity<Map<String, String>> createNutritionWarning(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody HealthWarningRequest request) {
        try {
            Long userId = Long.parseLong(userDetails.getUsername());
            healthNotificationService.sendNutritionWarningNotification(userId, request.getMessage());
            return ResponseEntity.ok(Map.of("message", "영양소 경고 알림이 생성되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "영양소 경고 알림 생성 실패",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 수분 섭취 부족 알림 생성
     */
    @PostMapping("/hydration-warning")
    public ResponseEntity<Map<String, String>> createHydrationWarning(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody HealthWarningRequest request) {
        try {
            Long userId = Long.parseLong(userDetails.getUsername());
            healthNotificationService.sendHydrationWarningNotification(userId, request.getMessage());
            return ResponseEntity.ok(Map.of("message", "수분 섭취 경고 알림이 생성되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "수분 섭취 경고 알림 생성 실패",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 목표 달성 알림 생성
     */
    @PostMapping("/goal-achievement")
    public ResponseEntity<Map<String, String>> createGoalAchievement(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody GoalAchievementRequest request) {
        try {
            Long userId = Long.parseLong(userDetails.getUsername());
            healthNotificationService.sendGoalAchievementNotification(userId, request.getGoalType(), request.getMessage());
            return ResponseEntity.ok(Map.of("message", "목표 달성 알림이 생성되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "목표 달성 알림 생성 실패",
                "message", e.getMessage()
            ));
        }
    }
} 
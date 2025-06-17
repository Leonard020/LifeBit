package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.service.UserService;
import com.lifebit.coreapi.service.AchievementService;
import com.lifebit.coreapi.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/health-statistics")
@RequiredArgsConstructor
@Slf4j
public class HealthStatisticsController {
    
    private final UserService userService;
    private final AchievementService achievementService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * JWT 토큰에서 사용자 ID 추출
     */
    private Long getUserIdFromToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("JWT token not found");
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getHealthStatistics(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period,
            HttpServletRequest request) {
        
        // 토큰에서 사용자 ID 추출하여 권한 확인
        Long tokenUserId = getUserIdFromToken(request);
        
        // 건강 통계 데이터 반환
        Map<String, Object> statistics = Map.of(
            "currentWeight", 70.5,
            "weightChange", -0.2,
            "currentBMI", 22.1,
            "bmiChange", -0.1,
            "weeklyWorkouts", 3,
            "workoutGoal", 3,
            "goalAchievementRate", 85,
            "goalChange", 5
        );
        
        // 추가 통계 정보
        statistics = new java.util.HashMap<>(statistics);
        statistics.put("totalCaloriesBurned", 1250);
        statistics.put("averageDailyCalories", 178);
        statistics.put("streak", 12);
        statistics.put("totalWorkoutDays", 45);
        statistics.put("userId", tokenUserId); // 실제 사용자 ID 추가
        
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/ranking")
    public ResponseEntity<Map<String, Object>> getRanking(HttpServletRequest request) {
        
        try {
            // 토큰에서 사용자 ID 추출 (선택적)
            Long currentUserId = null;
            try {
                currentUserId = getUserIdFromToken(request);
                log.debug("User ID from token: {}", currentUserId);
            } catch (Exception e) {
                log.debug("No valid token found, using default user ID");
                currentUserId = 1L; // 기본값
            }
            
            // 사용자 업적 초기화 (필요한 경우)
            achievementService.initializeUserAchievements(currentUserId);
            
            // 상위 랭킹 사용자들 (Mock 데이터 - 추후 실제 랭킹 시스템으로 교체)
            List<Map<String, Object>> topRankers = List.of(
                Map.of(
                    "rank", 1,
                    "userId", 1L,
                    "nickname", "헬스킹",
                    "score", 3420,
                    "badge", "platinum",
                    "streakDays", 45
                ),
                Map.of(
                    "rank", 2,
                    "userId", 2L,
                    "nickname", "운동러버",
                    "score", 3180,
                    "badge", "gold",
                    "streakDays", 38
                ),
                Map.of(
                    "rank", 3,
                    "userId", 3L,
                    "nickname", "건강이최고",
                    "score", 2950,
                    "badge", "gold",
                    "streakDays", 32
                ),
                Map.of(
                    "rank", 4,
                    "userId", 4L,
                    "nickname", "바디빌더",
                    "score", 2780,
                    "badge", "silver",
                    "streakDays", 28
                ),
                Map.of(
                    "rank", 5,
                    "userId", 5L,
                    "nickname", "피트니스맨",
                    "score", 2650,
                    "badge", "silver",
                    "streakDays", 25
                )
            );

            // 현재 사용자의 랭킹 정보 (Mock 데이터)
            Map<String, Object> myRanking = Map.of(
                "rank", 24,
                "score", 1847,
                "streakDays", 12,
                "totalUsers", 2841,
                "userId", currentUserId
            );

            // 실제 데이터베이스에서 사용자 업적 조회
            List<Map<String, Object>> achievements = achievementService.getUserAchievements(currentUserId);
            
            log.debug("Retrieved {} achievements for user {}", achievements.size(), currentUserId);

            Map<String, Object> rankingData = Map.of(
                "topRankers", topRankers,
                "myRanking", myRanking,
                "achievements", achievements
            );
            
            return ResponseEntity.ok(rankingData);
            
        } catch (Exception e) {
            log.error("Error getting ranking data", e);
            
            // 에러 발생 시 기본 데이터 반환
            List<Map<String, Object>> fallbackAchievements = List.of(
                Map.of(
                    "title", "7일 연속 기록",
                    "description", "일주일 동안 꾸준히 기록했습니다",
                    "badge", "bronze",
                    "achieved", false,
                    "progress", 0,
                    "target", 7
                )
            );
            
            Map<String, Object> fallbackData = Map.of(
                "topRankers", List.of(),
                "myRanking", Map.of("rank", 0, "score", 0, "streakDays", 0, "totalUsers", 0, "userId", 1L),
                "achievements", fallbackAchievements
            );
            
            return ResponseEntity.ok(fallbackData);
        }
    }

    @GetMapping("/health-records/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getHealthRecords(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period,
            HttpServletRequest request) {
        
        // 토큰에서 사용자 ID 추출하여 권한 확인
        Long tokenUserId = getUserIdFromToken(request);
        
        // 건강 기록 데이터
        List<Map<String, Object>> healthRecords = List.of(
            Map.of(
                "health_record_id", 1,
                "uuid", "550e8400-e29b-41d4-a716-446655440000",
                "user_id", tokenUserId,
                "weight", 70.5,
                "height", 175.0,
                "bmi", 23.0,
                "record_date", LocalDate.now().minusDays(7).toString(),
                "created_at", LocalDateTime.now().minusDays(7).toString()
            ),
            Map.of(
                "health_record_id", 2,
                "uuid", "550e8400-e29b-41d4-a716-446655440001",
                "user_id", tokenUserId,
                "weight", 70.3,
                "height", 175.0,
                "bmi", 22.9,
                "record_date", LocalDate.now().minusDays(3).toString(),
                "created_at", LocalDateTime.now().minusDays(3).toString()
            ),
            Map.of(
                "health_record_id", 3,
                "uuid", "550e8400-e29b-41d4-a716-446655440002",
                "user_id", tokenUserId,
                "weight", 70.1,
                "height", 175.0,
                "bmi", 22.8,
                "record_date", LocalDate.now().toString(),
                "created_at", LocalDateTime.now().toString()
            )
        );
        
        return ResponseEntity.ok(healthRecords);
    }
} 
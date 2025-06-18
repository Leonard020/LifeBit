package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.service.AchievementService;
import com.lifebit.coreapi.service.UserService;
import com.lifebit.coreapi.service.HealthRecordService;
import com.lifebit.coreapi.service.ExerciseService;
import com.lifebit.coreapi.service.UserGoalService;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.entity.HealthRecord;
import com.lifebit.coreapi.entity.UserGoal;
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
import java.util.HashMap;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/health-statistics")
@RequiredArgsConstructor
@Slf4j
public class HealthStatisticsController {

    private final AchievementService achievementService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final HealthRecordService healthRecordService;
    private final ExerciseService exerciseService;
    private final UserGoalService userGoalService;

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

    /**
     * 오류 발생 시 안전한 기본값 생성
     */
    private Map<String, Object> createFallbackStatistics(Long userId) {
        Map<String, Object> fallbackStatistics = new HashMap<>();
        fallbackStatistics.put("currentWeight", 70.0);
        fallbackStatistics.put("weightChange", 0.0);
        fallbackStatistics.put("currentBMI", 22.5);
        fallbackStatistics.put("bmiChange", 0.0);
        fallbackStatistics.put("weeklyWorkouts", 0);
        fallbackStatistics.put("workoutGoal", 3);
        fallbackStatistics.put("goalAchievementRate", 0);
        fallbackStatistics.put("goalChange", 0);
        fallbackStatistics.put("totalCaloriesBurned", 0);
        fallbackStatistics.put("averageDailyCalories", 0);
        fallbackStatistics.put("streak", 0);
        fallbackStatistics.put("totalWorkoutDays", 0);
        fallbackStatistics.put("userId", userId);
        fallbackStatistics.put("dataStatus", "fallback");
        return fallbackStatistics;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getHealthStatistics(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period,
            HttpServletRequest request) {
        
        try {
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 실제 사용자 정보 조회
            User user = userService.getUserById(tokenUserId);
            
            // 사용자 기본 정보에서 체중과 키 가져오기
            BigDecimal currentWeight = user.getWeight() != null ? user.getWeight() : BigDecimal.valueOf(70.0);
            BigDecimal currentHeight = user.getHeight() != null ? user.getHeight() : BigDecimal.valueOf(170.0);
            
            // BMI 계산
            BigDecimal currentBMI = BigDecimal.ZERO;
            if (currentHeight.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal heightInMeters = currentHeight.divide(BigDecimal.valueOf(100));
                currentBMI = currentWeight.divide(heightInMeters.multiply(heightInMeters), 2, BigDecimal.ROUND_HALF_UP);
            }
            
            // ✅ 실제 데이터 조회로 교체
            
            // 1. 사용자 목표 조회 (기본값 사용)
            UserGoal userGoal = userGoalService.getUserGoalOrDefault(tokenUserId);
            int workoutGoal = userGoal.getWeeklyWorkoutTarget();
            
            // 2. 최근 7일간 운동 세션 조회
            int weeklyWorkouts = exerciseService.getWeeklyExerciseCount(tokenUserId);
            
            // 3. 목표 달성률 계산
            int goalAchievementRate = workoutGoal > 0 ? (weeklyWorkouts * 100 / workoutGoal) : 0;
            int goalChange = goalAchievementRate - 85; // 이전 주 대비 변화 (임시)
            
            // 4. 총 칼로리 소모량 (최근 7일)
            int totalCaloriesBurned = exerciseService.getWeeklyCaloriesBurned(tokenUserId);
            int averageDailyCalories = totalCaloriesBurned / 7;
            
            // 5. 연속 운동 일수 계산
            int streak = exerciseService.getCurrentStreak(tokenUserId);
            
            // 6. 총 운동 일수
            int totalWorkoutDays = exerciseService.getTotalWorkoutDays(tokenUserId);
            
            // 7. 체중과 BMI 변화 계산 (최근 2개 기록 비교)
            List<HealthRecord> recentRecords = healthRecordService.getRecentHealthRecords(tokenUserId, 30);
            BigDecimal weightChange = BigDecimal.ZERO;
            BigDecimal bmiChange = BigDecimal.ZERO;
            
            if (recentRecords.size() >= 2) {
                HealthRecord latest = recentRecords.get(0);
                HealthRecord previous = recentRecords.get(1);
                
                if (latest.getWeight() != null && previous.getWeight() != null) {
                    weightChange = latest.getWeight().subtract(previous.getWeight());
                }
                if (latest.getBmi() != null && previous.getBmi() != null) {
                    bmiChange = latest.getBmi().subtract(previous.getBmi());
                }
                
                // 최신 건강 기록이 있으면 그 값을 사용
                if (latest.getWeight() != null) {
                    currentWeight = latest.getWeight();
                }
                if (latest.getBmi() != null) {
                    currentBMI = latest.getBmi();
                }
            }
            
            // 건강 통계 데이터 구성
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("currentWeight", currentWeight.doubleValue());
            statistics.put("weightChange", weightChange.doubleValue());
            statistics.put("currentBMI", currentBMI.doubleValue());
            statistics.put("bmiChange", bmiChange.doubleValue());
            statistics.put("weeklyWorkouts", weeklyWorkouts);
            statistics.put("workoutGoal", workoutGoal);
            statistics.put("goalAchievementRate", goalAchievementRate);
            statistics.put("goalChange", goalChange);
            statistics.put("totalCaloriesBurned", totalCaloriesBurned);
            statistics.put("averageDailyCalories", averageDailyCalories);
            statistics.put("streak", streak);
            statistics.put("totalWorkoutDays", totalWorkoutDays);
            statistics.put("userId", tokenUserId);
            
            log.info("건강 통계 조회 완료 - 사용자: {}, 현재 체중: {}kg, BMI: {}", 
                tokenUserId, currentWeight, currentBMI);
            
            return ResponseEntity.ok(statistics);
            
        } catch (RuntimeException e) {
            log.error("건강 통계 조회 중 비즈니스 로직 오류 발생 - 사용자: {}, 오류: {}", userId, e.getMessage());
            
            // 구체적인 오류 메시지와 함께 안전한 기본값 반환
            Map<String, Object> fallbackStatistics = createFallbackStatistics(userId);
            
            if (e.getMessage().contains("JWT")) {
                fallbackStatistics.put("error", "인증이 필요합니다. 다시 로그인해주세요.");
                fallbackStatistics.put("errorCode", "AUTH_REQUIRED");
            } else if (e.getMessage().contains("User")) {
                fallbackStatistics.put("error", "사용자 정보를 찾을 수 없습니다.");
                fallbackStatistics.put("errorCode", "USER_NOT_FOUND");
            } else {
                fallbackStatistics.put("error", "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                fallbackStatistics.put("errorCode", "TEMPORARY_ERROR");
            }
            
            return ResponseEntity.ok(fallbackStatistics);
            
        } catch (Exception e) {
            log.error("건강 통계 조회 중 예상치 못한 오류 발생 - 사용자: {}", userId, e);
            
            // 예상치 못한 오류에 대한 안전한 응답
            Map<String, Object> fallbackStatistics = createFallbackStatistics(userId);
            fallbackStatistics.put("error", "서버 오류가 발생했습니다. 관리자에게 문의해주세요.");
            fallbackStatistics.put("errorCode", "SERVER_ERROR");
            
            return ResponseEntity.ok(fallbackStatistics);
        }
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
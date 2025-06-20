package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.service.AchievementService;
import com.lifebit.coreapi.service.UserService;
import com.lifebit.coreapi.service.HealthRecordService;
import com.lifebit.coreapi.service.ExerciseService;
import com.lifebit.coreapi.service.UserGoalService;
import com.lifebit.coreapi.service.ranking.RankingService;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.entity.HealthRecord;
import com.lifebit.coreapi.entity.UserGoal;
import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.security.JwtTokenProvider;
import com.lifebit.coreapi.dto.ranking.RankingResponse;
import com.lifebit.coreapi.repository.ranking.UserRankingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
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
    private final RankingService rankingService;
    private final UserRankingRepository userRankingRepository;

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
            
            // 실제 데이터베이스에서 상위 랭킹 조회 (기본값 제공)
            List<Map<String, Object>> topRankers;
            Map<String, Object> myRanking;
            
            try {
                // 상위 5명 랭킹 조회
                Pageable topRankingsPageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "totalScore"));
                Page<UserRanking> topRankingsPage = userRankingRepository.findTopRankings(topRankingsPageable);
                
                topRankers = topRankingsPage.getContent().stream()
                    .map(ranking -> {
                        Map<String, Object> rankerMap = new HashMap<>();
                        rankerMap.put("rank", ranking.getRankPosition());
                        rankerMap.put("userId", ranking.getUserUuid());
                        rankerMap.put("nickname", ranking.getUsername() != null ? ranking.getUsername() : "사용자" + ranking.getUserUuid());
                        rankerMap.put("score", ranking.getTotalScore());
                        rankerMap.put("badge", getBadgeFromScore(ranking.getTotalScore()));
                        rankerMap.put("streakDays", ranking.getStreakDays());
                        return rankerMap;
                    })
                    .toList();
                
                // 현재 사용자의 랭킹 정보 조회
                User currentUser = userService.getUserById(currentUserId);
                Optional<UserRanking> userRankingOpt = userRankingRepository.findByUserUuid(currentUser.getUuid().toString());
                
                if (userRankingOpt.isPresent()) {
                    UserRanking userRanking = userRankingOpt.get();
                    myRanking = Map.of(
                        "rank", userRanking.getRankPosition(),
                        "score", userRanking.getTotalScore(),
                        "streakDays", userRanking.getStreakDays(),
                        "totalUsers", userRankingRepository.count(),
                        "userId", currentUserId
                    );
                } else {
                    // 사용자 랭킹이 없는 경우 기본값
                    myRanking = Map.of(
                        "rank", 0,
                        "score", 0,
                        "streakDays", 0,
                        "totalUsers", userRankingRepository.count(),
                        "userId", currentUserId
                    );
                }
                
                         } catch (Exception e) {
                log.warn("랭킹 데이터 조회 실패, 빈 데이터 반환: {}", e.getMessage());
                
                // 랭킹 조회 실패 시 빈 데이터 반환
                topRankers = List.of();
                
                myRanking = Map.of(
                    "rank", 0,
                    "score", 0,
                    "streakDays", 0,
                    "totalUsers", 0,
                    "userId", currentUserId
                );
            }

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
            
            // 에러 발생 시 빈 데이터 반환
            Map<String, Object> fallbackData = Map.of(
                "topRankers", List.of(),
                "myRanking", Map.of("rank", 0, "score", 0, "streakDays", 0, "totalUsers", 0, "userId", 1L),
                "achievements", List.of(),
                "error", "랭킹 데이터를 불러올 수 없습니다. 나중에 다시 시도해주세요."
            );
            
            return ResponseEntity.ok(fallbackData);
        }
    }
    
    /**
     * 점수에 따른 배지 결정
     */
    private String getBadgeFromScore(int score) {
        if (score >= 3000) return "platinum";
        else if (score >= 2500) return "gold";
        else if (score >= 2000) return "silver";
        else return "bronze";
    }

    @GetMapping("/health-records/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getHealthRecords(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period,
            HttpServletRequest request) {
        
        try {
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 실제 데이터베이스에서 건강 기록 조회
            List<HealthRecord> healthRecords;
            
            // 기간에 따른 데이터 조회
            switch (period.toLowerCase()) {
                case "day":
                    healthRecords = healthRecordService.getRecentHealthRecords(tokenUserId, 1);
                    break;
                case "week":
                    healthRecords = healthRecordService.getRecentHealthRecords(tokenUserId, 7);
                    break;
                case "month":
                    healthRecords = healthRecordService.getRecentHealthRecords(tokenUserId, 30);
                    break;
                case "year":
                    healthRecords = healthRecordService.getRecentHealthRecords(tokenUserId, 365);
                    break;
                default:
                    healthRecords = healthRecordService.getRecentHealthRecords(tokenUserId, 30);
            }
            
            // HealthRecord 엔티티를 Map으로 변환
            List<Map<String, Object>> healthRecordsData = healthRecords.stream()
                .map(record -> {
                    Map<String, Object> recordMap = new HashMap<>();
                    recordMap.put("health_record_id", record.getHealthRecordId());
                    recordMap.put("uuid", record.getUuid().toString());
                    recordMap.put("user_id", record.getUserId());
                    recordMap.put("weight", record.getWeight() != null ? record.getWeight().doubleValue() : null);
                    recordMap.put("height", record.getHeight() != null ? record.getHeight().doubleValue() : null);
                    recordMap.put("bmi", record.getBmi() != null ? record.getBmi().doubleValue() : null);
                    recordMap.put("record_date", record.getRecordDate().toString());
                    recordMap.put("created_at", record.getCreatedAt().toString());
                    return recordMap;
                })
                .toList();
            
            log.info("건강 기록 조회 완료 - 사용자: {}, 기간: {}, 개수: {}", 
                tokenUserId, period, healthRecordsData.size());
            
            return ResponseEntity.ok(healthRecordsData);
            
        } catch (RuntimeException e) {
            log.error("건강 기록 조회 중 오류 발생 - 사용자: {}, 기간: {}, 오류: {}", 
                userId, period, e.getMessage());
            
            // 오류 발생 시 빈 리스트 반환
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * 사용자의 운동 세션 데이터 조회
     */
    @GetMapping("/exercise-sessions/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getExerciseSessions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period,
            HttpServletRequest request) {
        
        try {
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 실제 데이터베이스에서 운동 세션 조회
            List<ExerciseSession> exerciseSessions = exerciseService.getRecentExerciseSessions(tokenUserId, period);
            
            // ExerciseSession 엔티티를 Map으로 변환
            List<Map<String, Object>> exerciseSessionsData = exerciseSessions.stream()
                .map(session -> {
                    Map<String, Object> sessionMap = new HashMap<>();
                    sessionMap.put("exercise_session_id", session.getExerciseSessionId());
                    sessionMap.put("uuid", session.getUuid().toString());
                    sessionMap.put("user_id", session.getUser().getUserId());
                    sessionMap.put("exercise_catalog_id", session.getExerciseCatalog() != null ? session.getExerciseCatalog().getExerciseCatalogId() : null);
                    sessionMap.put("exercise_name", session.getExerciseCatalog() != null ? session.getExerciseCatalog().getName() : "기타 운동");
                    sessionMap.put("duration_minutes", session.getDurationMinutes());
                    sessionMap.put("calories_burned", session.getCaloriesBurned());
                    sessionMap.put("weight", session.getWeight() != null ? session.getWeight().doubleValue() : null);
                    sessionMap.put("reps", session.getReps());
                    sessionMap.put("sets", session.getSets());
                    sessionMap.put("notes", session.getNotes());
                    sessionMap.put("exercise_date", session.getExerciseDate() != null ? session.getExerciseDate().toString() : null);
                    sessionMap.put("created_at", session.getCreatedAt().toString());
                    return sessionMap;
                })
                .toList();
            
            log.info("운동 세션 조회 완료 - 사용자: {}, 기간: {}, 개수: {}", 
                tokenUserId, period, exerciseSessionsData.size());
            
            return ResponseEntity.ok(exerciseSessionsData);
            
        } catch (RuntimeException e) {
            log.error("운동 세션 조회 중 오류 발생 - 사용자: {}, 기간: {}, 오류: {}", 
                userId, period, e.getMessage());
            
            // 오류 발생 시 빈 리스트 반환
            return ResponseEntity.ok(List.of());
        }
    }
} 
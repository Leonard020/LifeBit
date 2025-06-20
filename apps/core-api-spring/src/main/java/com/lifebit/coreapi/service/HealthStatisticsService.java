package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.HealthRecord;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.entity.UserGoal;
import com.lifebit.coreapi.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 통합된 건강 통계 서비스
 * 모든 건강 관련 데이터를 중앙에서 처리합니다.
 * 
 * 2024-12-31: 백엔드 리팩토링으로 생성
 * - 중복 로직 제거
 * - 단일 책임 원칙 적용
 * - 일관된 응답 형식 제공
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class HealthStatisticsService {

    private final HealthRecordService healthRecordService;
    private final ExerciseService exerciseService;
    private final MealService mealService;
    private final UserGoalService userGoalService;
    private final UserService userService;

    /**
     * 사용자의 종합 건강 통계 조회
     * 
     * @param userId 사용자 ID
     * @param period 조회 기간 (day, week, month, year)
     * @return 통합된 건강 통계 데이터
     */
    public Map<String, Object> getHealthStatistics(Long userId, String period) {
        try {
            log.info("건강 통계 조회 시작 - 사용자: {}, 기간: {}", userId, period);
            
            // 사용자 기본 정보 조회
            User user = userService.getUserById(userId);
            
            // 사용자 목표 조회 (기본값 사용)
            UserGoal userGoal = userGoalService.getUserGoalOrDefault(userId);
            
            // 기본 체중/키 정보
            BigDecimal currentWeight = user.getWeight() != null ? user.getWeight() : BigDecimal.valueOf(70.0);
            BigDecimal currentHeight = user.getHeight() != null ? user.getHeight() : BigDecimal.valueOf(170.0);
            
            // BMI 계산
            BigDecimal currentBMI = calculateBMI(currentWeight, currentHeight);
            
            // 운동 관련 통계
            Map<String, Object> exerciseStats = getExerciseStatistics(userId, period);
            
            // 건강 기록 관련 통계
            Map<String, Object> healthRecordStats = getHealthRecordStatistics(userId, period);
            
            // 식단 관련 통계
            Map<String, Object> mealStats = getMealStatistics(userId, period);
            
            // 종합 통계 구성
            Map<String, Object> statistics = new HashMap<>();
            
            // 기본 정보
            statistics.put("userId", userId);
            statistics.put("currentWeight", currentWeight.doubleValue());
            statistics.put("currentBMI", currentBMI.doubleValue());
            statistics.put("currentHeight", currentHeight.doubleValue());
            
            // 건강 기록 통계 추가
            statistics.putAll(healthRecordStats);
            
            // 운동 통계 추가
            statistics.putAll(exerciseStats);
            
            // 식단 통계 추가 (선택적)
            if (mealStats != null && !mealStats.isEmpty()) {
                statistics.putAll(mealStats);
            }
            
            // 목표 관련 정보
            statistics.put("workoutGoal", userGoal.getWeeklyWorkoutTarget());
            statistics.put("dailyCarbsTarget", userGoal.getDailyCarbsTarget());
            statistics.put("dailyProteinTarget", userGoal.getDailyProteinTarget());
            statistics.put("dailyFatTarget", userGoal.getDailyFatTarget());
            
            log.info("건강 통계 조회 완료 - 사용자: {}, 데이터 항목: {}", userId, statistics.size());
            
            return statistics;
            
        } catch (Exception e) {
            log.error("건강 통계 조회 중 오류 발생 - 사용자: {}, 오류: {}", userId, e.getMessage(), e);
            return createFallbackStatistics(userId);
        }
    }

    /**
     * 운동 관련 통계 조회
     */
    private Map<String, Object> getExerciseStatistics(Long userId, String period) {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // 최근 7일간 운동 횟수
            int weeklyWorkouts = exerciseService.getWeeklyExerciseCount(userId);
            
            // 총 칼로리 소모량 (최근 7일)
            int totalCaloriesBurned = exerciseService.getWeeklyCaloriesBurned(userId);
            int averageDailyCalories = totalCaloriesBurned / 7;
            
            // 연속 운동 일수
            int streak = exerciseService.getCurrentStreak(userId);
            
            // 총 운동 일수
            int totalWorkoutDays = exerciseService.getTotalWorkoutDays(userId);
            
            // 목표 달성률 계산
            UserGoal userGoal = userGoalService.getUserGoalOrDefault(userId);
            int workoutGoal = userGoal.getWeeklyWorkoutTarget();
            int goalAchievementRate = workoutGoal > 0 ? (weeklyWorkouts * 100 / workoutGoal) : 0;
            int goalChange = goalAchievementRate - 85; // 이전 주 대비 변화 (임시)
            
            stats.put("weeklyWorkouts", weeklyWorkouts);
            stats.put("totalCaloriesBurned", totalCaloriesBurned);
            stats.put("averageDailyCalories", averageDailyCalories);
            stats.put("streak", streak);
            stats.put("totalWorkoutDays", totalWorkoutDays);
            stats.put("goalAchievementRate", goalAchievementRate);
            stats.put("goalChange", goalChange);
            
        } catch (Exception e) {
            log.warn("운동 통계 조회 실패, 기본값 사용: {}", e.getMessage());
            stats.put("weeklyWorkouts", 0);
            stats.put("totalCaloriesBurned", 0);
            stats.put("averageDailyCalories", 0);
            stats.put("streak", 0);
            stats.put("totalWorkoutDays", 0);
            stats.put("goalAchievementRate", 0);
            stats.put("goalChange", 0);
        }
        
        return stats;
    }

    /**
     * 건강 기록 관련 통계 조회
     */
    private Map<String, Object> getHealthRecordStatistics(Long userId, String period) {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // 최근 2개 기록 비교를 위한 조회
            List<HealthRecord> recentRecords = healthRecordService.getRecentHealthRecords(userId, 30);
            
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
            }
            
            stats.put("weightChange", weightChange.doubleValue());
            stats.put("bmiChange", bmiChange.doubleValue());
            stats.put("healthRecordCount", recentRecords.size());
            
        } catch (Exception e) {
            log.warn("건강 기록 통계 조회 실패, 기본값 사용: {}", e.getMessage());
            stats.put("weightChange", 0.0);
            stats.put("bmiChange", 0.0);
            stats.put("healthRecordCount", 0);
        }
        
        return stats;
    }

    /**
     * 식단 관련 통계 조회 (선택적)
     */
    private Map<String, Object> getMealStatistics(Long userId, String period) {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // 식단 관련 통계는 선택적으로 구현
            // 현재는 기본값만 반환
            stats.put("dailyCaloriesAverage", 0);
            stats.put("mealLogCount", 0);
            
        } catch (Exception e) {
            log.warn("식단 통계 조회 실패: {}", e.getMessage());
        }
        
        return stats;
    }

    /**
     * BMI 계산
     */
    private BigDecimal calculateBMI(BigDecimal weight, BigDecimal height) {
        if (height.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal heightInMeters = height.divide(BigDecimal.valueOf(100));
        return weight.divide(heightInMeters.multiply(heightInMeters), 2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 오류 발생 시 안전한 기본값 생성
     */
    private Map<String, Object> createFallbackStatistics(Long userId) {
        Map<String, Object> fallback = new HashMap<>();
        
        fallback.put("userId", userId);
        fallback.put("currentWeight", 70.0);
        fallback.put("weightChange", 0.0);
        fallback.put("currentBMI", 24.0);
        fallback.put("bmiChange", 0.0);
        fallback.put("weeklyWorkouts", 0);
        fallback.put("workoutGoal", 3);
        fallback.put("goalAchievementRate", 0);
        fallback.put("goalChange", 0);
        fallback.put("totalCaloriesBurned", 0);
        fallback.put("averageDailyCalories", 0);
        fallback.put("streak", 0);
        fallback.put("totalWorkoutDays", 0);
        fallback.put("error", "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        fallback.put("errorCode", "TEMPORARY_ERROR");
        
        return fallback;
    }

    /**
     * 개별 건강 기록 조회 (HealthRecordController용)
     */
    public List<Map<String, Object>> getHealthRecords(Long userId, String period) {
        try {
            List<HealthRecord> healthRecords = getHealthRecordsByPeriod(userId, period);
            
            return healthRecords.stream()
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
                
        } catch (Exception e) {
            log.error("건강 기록 조회 실패: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * 개별 운동 세션 조회 (ExerciseSessionController용)
     */
    public List<Map<String, Object>> getExerciseSessions(Long userId, String period) {
        try {
            List<ExerciseSession> exerciseSessions = exerciseService.getRecentExerciseSessions(userId, period);
            
            return exerciseSessions.stream()
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
                
        } catch (Exception e) {
            log.error("운동 세션 조회 실패: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * 기간별 건강 기록 조회 헬퍼 메소드
     */
    private List<HealthRecord> getHealthRecordsByPeriod(Long userId, String period) {
        switch (period.toLowerCase()) {
            case "day":
                return healthRecordService.getRecentHealthRecords(userId, 1);
            case "week":
                return healthRecordService.getRecentHealthRecords(userId, 7);
            case "month":
                return healthRecordService.getRecentHealthRecords(userId, 30);
            case "year":
                return healthRecordService.getRecentHealthRecords(userId, 365);
            default:
                return healthRecordService.getRecentHealthRecords(userId, 30);
        }
    }
} 
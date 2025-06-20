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
            // period에 따른 기간 설정
            int days = getPeriodDays(period);
            
            // 설정된 기간 동안의 운동 횟수
            int periodWorkouts = exerciseService.getExerciseCountByPeriod(userId, days);
            
            // 설정된 기간 동안의 총 운동 시간 (분)
            int periodExerciseMinutes = exerciseService.getExerciseMinutesByPeriod(userId, days);
            
            // 설정된 기간 동안의 총 칼로리 소모량
            int totalCaloriesBurned = exerciseService.getCaloriesBurnedByPeriod(userId, days);
            int averageDailyCalories = days > 0 ? totalCaloriesBurned / days : 0;
            
            // 연속 운동 일수 (period 무관하게 전체 기간)
            int streak = exerciseService.getCurrentStreak(userId);
            
            // 총 운동 일수 (period 무관하게 전체 기간)
            int totalWorkoutDays = exerciseService.getTotalWorkoutDays(userId);
            
            // 목표 달성률 계산
            UserGoal userGoal = userGoalService.getUserGoalOrDefault(userId);
            int workoutGoal = userGoal.getWeeklyWorkoutTarget();
            
            // period에 따른 목표 조정
            int adjustedGoal = adjustGoalForPeriod(workoutGoal, period);
            int goalAchievementRate = adjustedGoal > 0 ? (periodWorkouts * 100 / adjustedGoal) : 0;
            int goalChange = goalAchievementRate - 85; // 이전 기간 대비 변화 (임시)
            
            // period별 필드명 설정
            String workoutKey = getWorkoutKey(period);
            String minutesKey = getMinutesKey(period);
            
            stats.put(workoutKey, periodWorkouts);  // weeklyWorkouts, monthlyWorkouts, dailyWorkouts
            stats.put(minutesKey, periodExerciseMinutes); // weeklyExerciseMinutes, monthlyExerciseMinutes, dailyExerciseMinutes
            stats.put("totalCaloriesBurned", totalCaloriesBurned);
            stats.put("averageDailyCalories", averageDailyCalories);
            stats.put("streak", streak);
            stats.put("totalWorkoutDays", totalWorkoutDays);
            stats.put("goalAchievementRate", goalAchievementRate);
            stats.put("goalChange", goalChange);
            
            log.info("운동 통계 조회 성공 - 사용자: {}, 기간: {}, 횟수: {}, 시간: {}분, 칼로리: {}", 
                    userId, period, periodWorkouts, periodExerciseMinutes, totalCaloriesBurned);
            
        } catch (Exception e) {
            log.warn("운동 통계 조회 실패, 기본값 사용: {}", e.getMessage());
            String workoutKey = getWorkoutKey(period);
            String minutesKey = getMinutesKey(period);
            
            stats.put(workoutKey, 0);
            stats.put(minutesKey, 0);
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
     * Period에 따른 일수 반환
     */
    private int getPeriodDays(String period) {
        switch (period.toLowerCase()) {
            case "day":
                return 1;
            case "week":
                return 7;
            case "month":
                return 30;
            case "year":
                return 365;
            default:
                return 7; // 기본값은 주간
        }
    }
    
    /**
     * Period에 따른 운동 횟수 필드명 반환
     */
    private String getWorkoutKey(String period) {
        switch (period.toLowerCase()) {
            case "day":
                return "dailyWorkouts";
            case "week":
                return "weeklyWorkouts";
            case "month":
                return "monthlyWorkouts";
            case "year":
                return "yearlyWorkouts";
            default:
                return "weeklyWorkouts";
        }
    }
    
    /**
     * Period에 따른 운동 시간 필드명 반환
     */
    private String getMinutesKey(String period) {
        switch (period.toLowerCase()) {
            case "day":
                return "dailyExerciseMinutes";
            case "week":
                return "weeklyExerciseMinutes";
            case "month":
                return "monthlyExerciseMinutes";
            case "year":
                return "yearlyExerciseMinutes";
            default:
                return "weeklyExerciseMinutes";
        }
    }
    
    /**
     * Period에 따른 목표 조정
     */
    private int adjustGoalForPeriod(int weeklyGoal, String period) {
        switch (period.toLowerCase()) {
            case "day":
                return Math.round(weeklyGoal / 7.0f);
            case "week":
                return weeklyGoal;
            case "month":
                return weeklyGoal * 4; // 월간 = 주간 × 4
            case "year":
                return weeklyGoal * 52; // 연간 = 주간 × 52
            default:
                return weeklyGoal;
        }
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
     * 식단 관련 통계 조회 (실제 영양소 데이터)
     */
    private Map<String, Object> getMealStatistics(Long userId, String period) {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // 오늘 날짜로 일일 영양소 섭취량 조회
            LocalDate today = LocalDate.now();
            
            // MealService를 통해 오늘의 영양소 정보 조회
            Map<String, Object> todayNutrition = mealService.getDailyNutritionSummary(userId, today);
            
            // 영양소 섭취량 추출 (기본값 0으로 설정)
            double dailyCalories = (Double) todayNutrition.getOrDefault("totalCalories", 0.0);
            double dailyCarbs = (Double) todayNutrition.getOrDefault("totalCarbs", 0.0);
            double dailyProtein = (Double) todayNutrition.getOrDefault("totalProtein", 0.0);
            double dailyFat = (Double) todayNutrition.getOrDefault("totalFat", 0.0);
            int mealLogCount = (Integer) todayNutrition.getOrDefault("mealCount", 0);
            
            // 통계 데이터에 추가
            stats.put("dailyCaloriesAverage", dailyCalories);
            stats.put("dailyCarbsIntake", dailyCarbs);
            stats.put("dailyProteinIntake", dailyProtein);
            stats.put("dailyFatIntake", dailyFat);
            stats.put("mealLogCount", mealLogCount);
            
            log.info("식단 통계 조회 성공 - 사용자: {}, 칼로리: {}, 탄수화물: {}, 단백질: {}, 지방: {}", 
                    userId, dailyCalories, dailyCarbs, dailyProtein, dailyFat);
            
        } catch (Exception e) {
            log.warn("식단 통계 조회 실패, 기본값 사용: {}", e.getMessage());
            stats.put("dailyCaloriesAverage", 0.0);
            stats.put("dailyCarbsIntake", 0.0);
            stats.put("dailyProteinIntake", 0.0);
            stats.put("dailyFatIntake", 0.0);
            stats.put("mealLogCount", 0);
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
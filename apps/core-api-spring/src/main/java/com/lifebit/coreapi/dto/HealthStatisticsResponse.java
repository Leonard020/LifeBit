package com.lifebit.coreapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 건강 통계 응답 DTO
 * 
 * 2024-12-31: 백엔드 리팩토링으로 생성
 * - 일관된 응답 형식 제공
 * - Map<String, Object> 대신 명확한 타입 사용
 * - API 문서화 개선
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthStatisticsResponse {
    
    // 기본 정보
    private Long userId;
    private Double currentWeight;
    private Double currentBMI;
    private Double currentHeight;
    
    // 건강 기록 변화
    private Double weightChange;
    private Double bmiChange;
    private Integer healthRecordCount;
    
    // 운동 관련 통계
    private Integer weeklyWorkouts;
    private Integer workoutGoal;
    private Integer goalAchievementRate;
    private Integer goalChange;
    private Integer totalCaloriesBurned;
    private Integer averageDailyCalories;
    private Integer streak;
    private Integer totalWorkoutDays;
    
    // 목표 관련 정보
    private Integer dailyCarbsTarget;
    private Integer dailyProteinTarget;
    private Integer dailyFatTarget;
    
    // 식단 관련 통계 (선택적)
    private Integer dailyCaloriesAverage;
    private Integer mealLogCount;
    
    // 메타데이터
    private String period;
    private LocalDateTime lastUpdated;
    private String dataStatus; // "success", "partial", "fallback"
    
    // 에러 정보 (선택적)
    private String error;
    private String errorCode;
    
    /**
     * 성공 응답 생성
     */
    public static HealthStatisticsResponse success(Long userId, String period) {
        return HealthStatisticsResponse.builder()
            .userId(userId)
            .period(period)
            .lastUpdated(LocalDateTime.now())
            .dataStatus("success")
            .build();
    }
    
    /**
     * 부분 성공 응답 생성 (일부 데이터 누락)
     */
    public static HealthStatisticsResponse partial(Long userId, String period, String error) {
        return HealthStatisticsResponse.builder()
            .userId(userId)
            .period(period)
            .lastUpdated(LocalDateTime.now())
            .dataStatus("partial")
            .error(error)
            .build();
    }
    
    /**
     * 폴백 응답 생성 (기본값 사용)
     */
    public static HealthStatisticsResponse fallback(Long userId, String period, String error, String errorCode) {
        return HealthStatisticsResponse.builder()
            .userId(userId)
            .period(period)
            .currentWeight(70.0)
            .weightChange(0.0)
            .currentBMI(24.0)
            .bmiChange(0.0)
            .weeklyWorkouts(0)
            .workoutGoal(3)
            .goalAchievementRate(0)
            .goalChange(0)
            .totalCaloriesBurned(0)
            .averageDailyCalories(0)
            .streak(0)
            .totalWorkoutDays(0)
            .dailyCarbsTarget(250)
            .dailyProteinTarget(150)
            .dailyFatTarget(67)
            .dailyCaloriesAverage(0)
            .mealLogCount(0)
            .lastUpdated(LocalDateTime.now())
            .dataStatus("fallback")
            .error(error)
            .errorCode(errorCode)
            .build();
    }
} 
package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.AnalyticsResponseDto.*;
import com.lifebit.coreapi.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
public class AdminAnalyticsService {

    // Repository 의존성 제거 - 현재는 시뮬레이션 데이터만 사용
    // private final UserRepository userRepository;
    // private final ExerciseSessionRepository exerciseSessionRepository;
    // private final MealLogRepository mealLogRepository;
    
    // 색상 상수
    private static final String[] EXERCISE_COLORS = {
        "#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#3B82F6", "#8B5A2B", "#EC4899"
    };
    private static final String[] MEAL_COLORS = {
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"
    };

    public List<AccessStatsDto> getAccessStats(String period) {
        log.info("접속 통계 조회 - 기간: {}", period);
        
        try {
            List<AccessStatsDto> results = new ArrayList<>();
            Random random = new Random(123); // 고정 시드로 일관된 데이터
            
            switch (period.toLowerCase()) {
                case "daily":
                    // 24시간 데이터
                    for (int hour = 0; hour < 24; hour++) {
                        Long count = (long) (random.nextDouble() * 100 + 20);
                        
                        results.add(AccessStatsDto.builder()
                            .period(hour + "시")
                            .접속자(count)
                            .build());
                    }
                    break;
                    
                case "weekly":
                    String[] days = {"월", "화", "수", "목", "금", "토", "일"};
                    for (int i = 0; i < days.length; i++) {
                        Long count = (long) (random.nextDouble() * 500 + 300);
                        results.add(AccessStatsDto.builder()
                            .period(days[i])
                            .접속자(count)
                            .build());
                    }
                    break;
                    
                case "monthly":
                    for (int week = 1; week <= 4; week++) {
                        Long count = (long) (random.nextDouble() * 1500 + 1200);
                        results.add(AccessStatsDto.builder()
                            .period(week + "주차")
                            .접속자(count)
                            .build());
                    }
                    break;
                    
                case "yearly":
                    String[] months = {"1월", "2월", "3월", "4월", "5월", "6월", 
                                     "7월", "8월", "9월", "10월", "11월", "12월"};
                    for (String month : months) {
                        Long count = (long) (random.nextDouble() * 10000 + 8000);
                        results.add(AccessStatsDto.builder()
                            .period(month)
                            .접속자(count)
                            .build());
                    }
                    break;
                    
                default:
                    throw new IllegalArgumentException("지원하지 않는 기간: " + period);
            }
            
            return results;
            
        } catch (Exception e) {
            log.error("접속 통계 조회 실패", e);
            return Collections.emptyList();
        }
    }

    public List<UserActivityDto> getUserActivityStats(String period) {
        log.info("사용자 활동 통계 조회 - 기간: {}", period);
        
        try {
            List<UserActivityDto> results = new ArrayList<>();
            Random random = new Random(42); // 고정 시드로 일관된 데이터
            
            switch (period.toLowerCase()) {
                case "daily":
                    for (int hour = 0; hour < 24; hour++) {
                        Long totalUsers = (long) (random.nextDouble() * 300 + 200);
                        Long activeUsers = Math.round(totalUsers * (0.3 + random.nextDouble() * 0.2));
                        
                        results.add(UserActivityDto.builder()
                            .period(hour + "시")
                            .총접속자(totalUsers)
                            .활동사용자(activeUsers)
                            .build());
                    }
                    break;
                    
                case "weekly":
                    String[] days = {"월", "화", "수", "목", "금", "토", "일"};
                    for (String day : days) {
                        Long totalUsers = (long) (random.nextDouble() * 1000 + 500);
                        Long activeUsers = Math.round(totalUsers * (0.35 + random.nextDouble() * 0.15));
                        
                        results.add(UserActivityDto.builder()
                            .period(day)
                            .총접속자(totalUsers)
                            .활동사용자(activeUsers)
                            .build());
                    }
                    break;
                    
                case "monthly":
                    for (int week = 1; week <= 4; week++) {
                        Long totalUsers = (long) (random.nextDouble() * 2000 + 1500);
                        Long activeUsers = Math.round(totalUsers * (0.25 + random.nextDouble() * 0.2));
                        
                        results.add(UserActivityDto.builder()
                            .period(week + "주차")
                            .총접속자(totalUsers)
                            .활동사용자(activeUsers)
                            .build());
                    }
                    break;
                    
                case "yearly":
                    String[] months = {"1월", "2월", "3월", "4월", "5월", "6월", 
                                     "7월", "8월", "9월", "10월", "11월", "12월"};
                    for (String month : months) {
                        Long totalUsers = (long) (random.nextDouble() * 10000 + 8000);
                        Long activeUsers = Math.round(totalUsers * (0.2 + random.nextDouble() * 0.25));
                        
                        results.add(UserActivityDto.builder()
                            .period(month)
                            .총접속자(totalUsers)
                            .활동사용자(activeUsers)
                            .build());
                    }
                    break;
            }
            
            return results;
            
        } catch (Exception e) {
            log.error("사용자 활동 통계 조회 실패", e);
            return Collections.emptyList();
        }
    }

    public List<ExerciseStatsDto> getExerciseStats(String period) {
        log.info("운동 통계 조회 - 기간: {}", period);
        
        try {
            List<ExerciseStatsDto> results = new ArrayList<>();
            Random random = new Random(456); // 고정 시드로 일관된 데이터
            
            switch (period.toLowerCase()) {
                case "daily":
                    String[] exercises = {"가슴", "등", "어깨", "팔", "복근", "하체", "유산소"};
                    for (int i = 0; i < exercises.length; i++) {
                        Long count = (long) (random.nextDouble() * 30 + 15);
                        
                        results.add(ExerciseStatsDto.builder()
                            .category(exercises[i])
                            .참여자(count)
                            .color(EXERCISE_COLORS[i])
                            .build());
                    }
                    break;
                    
                case "weekly":
                    String[] days = {"월", "화", "수", "목", "금", "토", "일"};
                    for (int i = 0; i < days.length; i++) {
                        Long count = (long) (random.nextDouble() * 70 + 50);
                        
                        results.add(ExerciseStatsDto.builder()
                            .category(days[i])
                            .참여자(count)
                            .color(EXERCISE_COLORS[i])
                            .build());
                    }
                    break;
                    
                case "monthly":
                    for (int week = 1; week <= 4; week++) {
                        Long count = (long) (random.nextDouble() * 150 + 100);
                        
                        results.add(ExerciseStatsDto.builder()
                            .category(week + "주차")
                            .참여자(count)
                            .color(EXERCISE_COLORS[week - 1])
                            .build());
                    }
                    break;
                    
                case "yearly":
                    String[] months = {"1월", "2월", "3월", "4월", "5월", "6월", 
                                     "7월", "8월", "9월", "10월", "11월", "12월"};
                    for (int i = 0; i < months.length; i++) {
                        Long count = (long) (random.nextDouble() * 500 + 400);
                        
                        results.add(ExerciseStatsDto.builder()
                            .category(months[i])
                            .참여자(count)
                            .color(EXERCISE_COLORS[i % EXERCISE_COLORS.length])
                            .build());
                    }
                    break;
            }
            
            return results;
            
        } catch (Exception e) {
            log.error("운동 통계 조회 실패", e);
            return Collections.emptyList();
        }
    }

    public List<MealStatsDto> getMealStats(String period) {
        log.info("식사 통계 조회 - 기간: {}", period);
        
        try {
            List<MealStatsDto> results = new ArrayList<>();
            Random random = new Random(789); // 고정 시드로 일관된 데이터
            
            switch (period.toLowerCase()) {
                case "daily":
                    String[] meals = {"아침", "점심", "저녁", "간식"};
                    for (int i = 0; i < meals.length; i++) {
                        Long count = (long) (random.nextDouble() * 120 + 80);
                        
                        results.add(MealStatsDto.builder()
                            .name(meals[i])
                            .value(count)
                            .color(MEAL_COLORS[i])
                            .build());
                    }
                    break;
                    
                case "weekly":
                    String[] days = {"월", "화", "수", "목", "금", "토", "일"};
                    for (String day : days) {
                        results.add(MealStatsDto.builder()
                            .날짜(day)
                            .아침((long) (random.nextDouble() * 60 + 60))
                            .점심((long) (random.nextDouble() * 70 + 80))
                            .저녁((long) (random.nextDouble() * 60 + 70))
                            .간식((long) (random.nextDouble() * 50 + 30))
                            .build());
                    }
                    break;
                    
                case "monthly":
                    for (int week = 1; week <= 4; week++) {
                        Long count = (long) (random.nextDouble() * 200 + 200);
                        
                        results.add(MealStatsDto.builder()
                            .name(week + "주차")
                            .value(count)
                            .color(MEAL_COLORS[week - 1])
                            .build());
                    }
                    break;
                    
                case "yearly":
                    String[] months = {"1월", "2월", "3월", "4월", "5월", "6월", 
                                     "7월", "8월", "9월", "10월", "11월", "12월"};
                    for (int i = 0; i < months.length; i++) {
                        Long count = (long) (random.nextDouble() * 700 + 800);
                        
                        results.add(MealStatsDto.builder()
                            .name(months[i])
                            .value(count)
                            .color(MEAL_COLORS[i % MEAL_COLORS.length])
                            .build());
                    }
                    break;
            }
            
            return results;
            
        } catch (Exception e) {
            log.error("식사 통계 조회 실패", e);
            return Collections.emptyList();
        }
    }

    public AnalyticsDataDto getAllAnalytics(String period) {
        log.info("전체 애널리틱스 데이터 조회 - 기간: {}", period);
        
        return AnalyticsDataDto.builder()
            .accessStats(getAccessStats(period))
            .userActivity(getUserActivityStats(period))
            .exerciseStats(getExerciseStats(period))
            .mealStats(getMealStats(period))
            .build();
    }
} 
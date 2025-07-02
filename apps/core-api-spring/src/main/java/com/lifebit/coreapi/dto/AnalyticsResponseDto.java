package com.lifebit.coreapi.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AnalyticsResponseDto {
    
    @Getter
    @Builder
    public static class AccessStatsDto {
        private String period;
        private Long 접속자;
    }
    
    @Getter
    @Builder
    public static class UserActivityDto {
        private String period;
        private Long 총접속자;
        private Long 활동사용자;
    }
    
    @Getter
    @Builder
    public static class ExerciseStatsDto {
        private String category;
        private Long 참여자;
        private String color;
    }
    
    @Getter
    @Builder
    public static class MealStatsDto {
        private String name;
        private Long value;
        private String color;
        
        // 주간용 추가 필드들
        private String 날짜;
        private Long 아침;
        private Long 점심;
        private Long 저녁;
        private Long 간식;
    }
    
    @Getter
    @Builder
    public static class AnalyticsDataDto {
        private List<AccessStatsDto> accessStats;
        private List<UserActivityDto> userActivity;
        private List<ExerciseStatsDto> exerciseStats;
        private List<MealStatsDto> mealStats;
    }
} 
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
        private SummaryDto summary; // 요약 정보 추가
    }
    
    @Getter
    @Builder
    public static class SummaryDto {
        private PeriodSummaryDto current;
        private PeriodSummaryDto previous;
    }
    
    @Getter
    @Builder
    public static class PeriodSummaryDto {
        private Long totalUsers;     // 총 회원수
        private Long activeUsers;    // 접속자
        private Long recordingUsers; // 활동 사용자
    }
} 
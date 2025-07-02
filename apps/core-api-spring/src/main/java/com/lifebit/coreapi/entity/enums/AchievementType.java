package com.lifebit.coreapi.entity.enums;

/**
 * 업적 타입 enum
 * 업적의 종류를 정의하고 실제 DB 제목과 매핑
 */
public enum AchievementType {
    // 연속 운동 업적
    STREAK_7("주간 전사", 7),
    STREAK_30("월간 마스터", 30),
    STREAK_90("3개월 챌린지", 90),
    STREAK_180("6개월 레전드", 180),
    
    // 운동 횟수 업적
    TOTAL_WORKOUT_DAYS("운동 애호가", 50),
    WEEKLY_EXERCISE("주간 전사", 7),
    MONTHLY_EXERCISE("월간 마스터", 30),
    
    // 기타 업적들
    FIRST_EXERCISE("첫 걸음", 1),
    FIRST_MEAL("식단 시작", 1),
    
    // 연속 식단 기록 업적
    CONSECUTIVE_MEAL_7("건강한 한 주", 7),
    CONSECUTIVE_MEAL_14("식단 전문가", 14),
    CONSECUTIVE_MEAL_30("식단 기록자", 30),
    CONSECUTIVE_MEAL_60("식단 완벽주의자", 60);
    
    private final String title;
    private final int targetValue;
    
    AchievementType(String title, int targetValue) {
        this.title = title;
        this.targetValue = targetValue;
    }
    
    public String getTitle() {
        return title;
    }
    
    public int getTargetValue() {
        return targetValue;
    }
    
    /**
     * 업적 타입으로 실제 DB 제목 조회
     */
    public static String getTitleByType(String type) {
        try {
            return valueOf(type).getTitle();
        } catch (IllegalArgumentException e) {
            return type; // 매핑되지 않은 경우 원본 반환
        }
    }
    
    /**
     * 진행도가 목표에 도달했는지 확인
     */
    public boolean isCompleted(int progress) {
        return progress >= targetValue;
    }
    
    /**
     * 진행도 퍼센트 계산
     */
    public int getProgressPercentage(int progress) {
        return Math.min((progress * 100) / targetValue, 100);
    }
} 
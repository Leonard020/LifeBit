package com.lifebit.coreapi.constant.ranking;

public final class RankingConstants {
    private RankingConstants() {
        throw new IllegalStateException("Constant class");
    }

    // 랭킹 점수 관련 상수
    public static final int MIN_SCORE = 0;
    public static final int MAX_SCORE = 10000;
    public static final int DEFAULT_SCORE = 0;

    // 랭킹 순위 관련 상수
    public static final int MIN_RANK = 1;
    public static final int DEFAULT_RANK = 999;

    // 연속 기록 관련 상수
    public static final int MIN_STREAK_DAYS = 0;
    public static final int DEFAULT_STREAK_DAYS = 0;
    public static final int MAX_STREAK_DAYS = 365;

    // 보상 관련 상수
    public static final int REWARD_POINTS_WEEKLY_TOP_1 = 1000;
    public static final int REWARD_POINTS_WEEKLY_TOP_10 = 500;
    public static final int REWARD_POINTS_MONTHLY_TOP_1 = 5000;
    public static final int REWARD_POINTS_MONTHLY_TOP_10 = 2000;
    public static final int REWARD_POINTS_SEASON_TOP_1 = 10000;
    public static final int REWARD_POINTS_SEASON_TOP_10 = 5000;
    public static final int REWARD_POINTS_STREAK_7_DAYS = 100;
    public static final int REWARD_POINTS_STREAK_30_DAYS = 500;
    public static final int REWARD_POINTS_STREAK_100_DAYS = 2000;
    public static final int TOP_RANK_REWARD = 3;
    public static final int TOP_STREAK_REWARD = 10;
    public static final int WEEKLY_TOP_RANK_POINTS = 100;
    public static final int MONTHLY_TOP_RANK_POINTS = 300;
    public static final int STREAK_REWARD_POINTS = 50;

    // 페이지네이션 관련 상수
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 100;

    // 캐시 관련 상수
    public static final String CACHE_KEY_RANKING = "ranking";
    public static final String CACHE_KEY_RANKING_HISTORY = "ranking_history";
    public static final String CACHE_KEY_RANKING_REWARDS = "ranking_rewards";
    public static final long CACHE_TTL_RANKING = 3600; // 1시간
    public static final long CACHE_TTL_RANKING_HISTORY = 86400; // 24시간
    public static final long CACHE_TTL_RANKING_REWARDS = 3600; // 1시간
} 
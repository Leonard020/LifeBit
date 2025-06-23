package com.lifebit.coreapi.dto.ranking;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MyRankingResponseDto {
    private final int rank;
    private final int score;
    private final int streakDays;
    private final long totalUsers;
    private final Long userId;
    private final String nickname;
    private final String tier;
    private final String colorCode;
} 
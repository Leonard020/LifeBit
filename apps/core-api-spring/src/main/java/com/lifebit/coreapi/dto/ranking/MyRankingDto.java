package com.lifebit.coreapi.dto.ranking;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MyRankingDto {
    private final int rank;
    private final int score;
    private final int streakDays;
    private final long totalUsers;
} 
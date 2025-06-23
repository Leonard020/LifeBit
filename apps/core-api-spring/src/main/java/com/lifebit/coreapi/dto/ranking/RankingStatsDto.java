package com.lifebit.coreapi.dto.ranking;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RankingStatsDto {
    private final long totalRankings;
    private final int myRank;
    private final int myTotalScore;
    private final int myStreakDays;
} 
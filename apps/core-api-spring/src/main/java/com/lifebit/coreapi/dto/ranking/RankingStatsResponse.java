package com.lifebit.coreapi.dto.ranking;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RankingStatsResponse {
    private final long totalRankings;
    private final int myRank;
    private final int myTotalScore;
    private final int myStreakDays;
    private final int mySeasonRank;
    private final int mySeasonPoints;
    private final int myPeriodRank;
    private final int myPeriodPoints;
    private final Integer totalRewards;
    private final Integer unclaimedRewards;
    private final Integer unreadNotifications;
} 
package com.lifebit.coreapi.dto.ranking;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RankingRewardDto {
    private final Long userId;
    private final String nickname;
    private final int rankPosition;
    private final int totalScore;
    private final String rewardType; // season, period, streak, personal 등
    private final int rewardPoints;
} 
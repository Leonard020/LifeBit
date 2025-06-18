package com.lifebit.coreapi.dto.ranking;

import com.lifebit.coreapi.entity.enums.PeriodType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RankingRewardResponse {
    private final String userUuid;
    private final String username;
    private final int rankPosition;
    private final int totalScore;
    private final int streakDays;
    private final PeriodType periodType;
    private final int periodRank;
    private final int periodPoints;
    private final String season;
    private final int seasonRank;
    private final int seasonPoints;
} 
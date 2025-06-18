package com.lifebit.coreapi.dto.ranking;

import com.lifebit.coreapi.entity.enums.PeriodType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RankingHistoryResponse {
    private final String userUuid;
    private final String username;
    private final int totalScore;
    private final int rankPosition;
    private final PeriodType periodType;
    private final int periodRank;
    private final int periodPoints;
    private final String season;
    private final int seasonRank;
    private final int seasonPoints;
    private final int streakDays;
    private final LocalDateTime recordedAt;
} 
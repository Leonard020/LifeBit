package com.lifebit.coreapi.dto.ranking;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class RankingHistoryDto {
    private final LocalDateTime recordedAt;
    private final int totalScore;
    private final int rankPosition;
    private final int streakDays;
    private final int season;
    private final String periodType;
} 
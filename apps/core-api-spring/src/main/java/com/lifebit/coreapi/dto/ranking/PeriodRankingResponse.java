package com.lifebit.coreapi.dto.ranking;

import com.lifebit.coreapi.entity.enums.PeriodType;
import lombok.Getter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeriodRankingResponse {
    private String userUuid;
    private String username;
    private int totalScore;
    private int rankPosition;
    private int streakDays;
    private PeriodType periodType;
    private int periodRank;
    private int periodPoints;
} 
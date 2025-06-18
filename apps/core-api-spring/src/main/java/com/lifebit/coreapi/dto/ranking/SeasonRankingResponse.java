package com.lifebit.coreapi.dto.ranking;

import lombok.Getter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeasonRankingResponse {
    private String userUuid;
    private String username;
    private int totalScore;
    private int rankPosition;
    private int streakDays;
    private String season;
    private int seasonRank;
    private int seasonPoints;
} 
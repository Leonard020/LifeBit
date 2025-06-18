package com.lifebit.coreapi.dto.ranking;

import lombok.Getter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RankingResponse {
    private String userUuid;
    private String username;
    private int totalScore;
    private int rankPosition;
    private int streakDays;
} 
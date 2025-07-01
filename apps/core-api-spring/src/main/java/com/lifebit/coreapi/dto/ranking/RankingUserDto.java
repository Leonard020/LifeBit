package com.lifebit.coreapi.dto.ranking;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RankingUserDto {
    private final int rank;
    private final Long userId;
    private final String nickname;
    private final int score;
    private final String badge;
    private final int streakDays;
    private final String tier;
    private final String colorCode;
    private final String profileImageUrl;
} 
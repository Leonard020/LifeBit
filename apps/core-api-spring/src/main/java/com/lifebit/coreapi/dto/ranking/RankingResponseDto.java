package com.lifebit.coreapi.dto.ranking;

import lombok.Getter;
import lombok.Builder;
import lombok.AllArgsConstructor;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class RankingResponseDto {
    private final List<RankingUserDto> topRankers;
    private final MyRankingDto myRanking;
} 
package com.lifebit.coreapi.dto.ranking;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class RankingRequest {
    private Integer season;
    private String periodType; // DAILY, WEEKLY, MONTHLY, SEASONAL
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer limit;
    private Integer offset;
    private String sortBy; // totalScore, streakDays, rankPosition
    private String sortDirection; // ASC, DESC
} 
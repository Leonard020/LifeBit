package com.lifebit.coreapi.dto.ranking;

import lombok.Data;

@Data
public class RankingAchievementResponse {
    private String title;
    private String description;
    private Integer points;
    private Boolean isCompleted;
} 
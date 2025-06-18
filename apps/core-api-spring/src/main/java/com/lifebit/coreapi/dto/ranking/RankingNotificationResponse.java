package com.lifebit.coreapi.dto.ranking;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RankingNotificationResponse {
    private final String userUuid;
    private final String title;
    private final String message;
    private final LocalDateTime createdAt;
    private final boolean isRead;
} 
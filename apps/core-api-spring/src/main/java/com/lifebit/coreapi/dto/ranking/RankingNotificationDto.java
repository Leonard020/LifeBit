package com.lifebit.coreapi.dto.ranking;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class RankingNotificationDto {
    private final Long id;
    private final String title;
    private final String message;
    private final boolean isRead;
    private final LocalDateTime createdAt;
} 
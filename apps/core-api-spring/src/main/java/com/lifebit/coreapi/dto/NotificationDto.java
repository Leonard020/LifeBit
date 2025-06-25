package com.lifebit.coreapi.dto;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationDto {
    private final Long id;
    private final String type;
    private final Long refId;
    private final String title;
    private final String message;
    private final boolean isRead;
    private final LocalDateTime createdAt;
} 
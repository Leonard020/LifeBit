package com.lifebit.coreapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(force = true)
public class NotificationDto {
    @JsonProperty("id")
    private Long id;
    @JsonProperty("type")
    private String type;
    @JsonProperty("refId")
    private Long refId;
    @JsonProperty("title")
    private String title;
    @JsonProperty("message")
    private String message;
    @JsonProperty("isRead")
    private boolean isRead;
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;
    @JsonProperty("userId")
    private Long userId;
} 
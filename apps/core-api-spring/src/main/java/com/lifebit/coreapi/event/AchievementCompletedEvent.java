package com.lifebit.coreapi.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class AchievementCompletedEvent extends ApplicationEvent {
    private final Long userId;
    
    public AchievementCompletedEvent(Long userId) {
        super(userId);
        this.userId = userId;
    }
} 
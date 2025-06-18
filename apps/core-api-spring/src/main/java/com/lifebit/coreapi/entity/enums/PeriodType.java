package com.lifebit.coreapi.entity.enums;

public enum PeriodType {
    DAILY("일간"),
    WEEKLY("주간"),
    MONTHLY("월간"),
    SEASON("시즌");

    private final String description;

    PeriodType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 
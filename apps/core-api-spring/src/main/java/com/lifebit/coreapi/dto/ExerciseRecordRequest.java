package com.lifebit.coreapi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ExerciseRecordRequest {
    private Long catalogId;
    private Integer durationMinutes;
    private Integer caloriesBurned;
    private String notes;
} 
package com.lifebit.coreapi.dto;

import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;


import java.time.LocalDate;

@Getter @Setter
public class ExerciseRecordRequest {
    private Long catalogId;

    private Integer sets;
    private Integer reps;
    private Double weight;

    @JsonProperty("duration_minutes")
    private Integer durationMinutes;
    private Integer caloriesBurned;
    private String notes;

    private LocalDate exerciseDate; // ⏰ 생략 시 서버에서 LocalDate.now() 처리 가능
}
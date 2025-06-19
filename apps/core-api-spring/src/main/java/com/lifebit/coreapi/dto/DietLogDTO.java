package com.lifebit.coreapi.dto;

import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;

@Getter @Setter
public class DietLogDTO {
    private Long id;
    private Long userId;
    private Long foodItemId;
    private String foodName;
    private double quantity;
    private double calories;
    private double carbs;
    private double protein;
    private double fat;
    private String logDate;
    private String unit;

    @JsonProperty("meal_time")
    private String mealTime; // ENUM: breakfast, lunch, dinner, snack

    @JsonProperty("input_source")
    private String inputSource; // ENUM: VOICE, TYPING

    @JsonProperty("confidence_score")
    private Double confidenceScore;

    @JsonProperty("original_audio_path")
    private String originalAudioPath;

    @JsonProperty("validation_status")
    private String validationStatus; // ENUM: PENDING, VALIDATED, REJECTED

    @JsonProperty("validation_notes")
    private String validationNotes;

    @JsonProperty("created_at")
    private String createdAt;
} 
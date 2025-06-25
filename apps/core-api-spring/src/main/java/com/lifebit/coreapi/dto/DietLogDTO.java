package com.lifebit.coreapi.dto;

import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
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
    private String mealTime; // ENUM: breakfast, lunch, dinner, snack
    private String inputSource; // ENUM: VOICE, TYPING
    private Double confidenceScore;
    private String originalAudioPath;
    private String validationStatus; // ENUM: PENDING, VALIDATED, REJECTED
    private String validationNotes;
    private String createdAt;
} 
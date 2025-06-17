package com.lifebit.coreapi.dto;

import lombok.Getter;
import lombok.Setter;

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
} 
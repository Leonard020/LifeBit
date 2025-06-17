package com.lifebit.coreapi.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
@AllArgsConstructor
public class DietNutritionDTO {
    private String name;
    private double target;
    private double current;
    private String unit;
    private double percentage;
} 
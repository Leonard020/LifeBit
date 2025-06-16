package com.lifebit.coreapi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DietNutritionDTO {
    private String name;
    private Integer target;
    private Integer current;
    private String unit;
    private Double percentage;
} 
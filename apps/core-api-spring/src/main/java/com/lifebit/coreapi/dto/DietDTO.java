package com.lifebit.coreapi.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class DietDTO {
    private Long id;
    private String foodName;
    private Double quantity;
    private Double calories;
    private Double carbs;
    private Double protein;
    private Double fat;
    private LocalDate logDate;
    private String unit;
} 
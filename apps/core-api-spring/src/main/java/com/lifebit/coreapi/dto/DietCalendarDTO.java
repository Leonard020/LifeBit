package com.lifebit.coreapi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class DietCalendarDTO {
    private boolean hasExercise;
    private boolean hasDiet;
    private int exerciseCount;
    private int dietCount;
} 
package com.lifebit.coreapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutDTO {
    private String exerciseName;
    private String part;
    private int sets;
    private int reps;
    private int weight;
}
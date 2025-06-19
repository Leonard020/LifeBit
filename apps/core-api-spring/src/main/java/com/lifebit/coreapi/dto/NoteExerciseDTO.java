package com.lifebit.coreapi.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class NoteExerciseDTO {
    private String name;
    private int sets;
    private int reps;
    private double weight;
    private String time; // 예: "45분"
}
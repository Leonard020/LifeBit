package com.lifebit.coreapi.dto;

import java.time.LocalDate;

public class WorkoutDTO {

    private Long id;
    private LocalDate date;
    private String exerciseName;
    private String type;
    private int duration;
    private int reps;
    private int sets;
    private double weight;
    private int caloriesBurned;

    // 기본 생성자
    public WorkoutDTO() {
    }

    // 전체 필드 생성자
    public WorkoutDTO(Long id, LocalDate date, String exerciseName, String type,
            int duration, int reps, int sets, double weight, int caloriesBurned) {
        this.id = id;
        this.date = date;
        this.exerciseName = exerciseName;
        this.type = type;
        this.duration = duration;
        this.reps = reps;
        this.sets = sets;
        this.weight = weight;
        this.caloriesBurned = caloriesBurned;
    }

    // Getter
    public Long getId() {
        return id;
    }

    public LocalDate getDate() {
        return date;
    }

    public String getExerciseName() {
        return exerciseName;
    }

    public String getType() {
        return type;
    }

    public int getDuration() {
        return duration;
    }

    public int getReps() {
        return reps;
    }

    public int getSets() {
        return sets;
    }

    public double getWeight() {
        return weight;
    }

    public int getCaloriesBurned() {
        return caloriesBurned;
    }
}
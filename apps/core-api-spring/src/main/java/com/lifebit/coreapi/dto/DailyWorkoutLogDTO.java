package com.lifebit.coreapi.dto;

public class DailyWorkoutLogDTO {

    private String name;
    private double weight;
    private int sets;
    private int reps;
    private String time; // "45분" 같은 문자열

    public DailyWorkoutLogDTO() {}

    public DailyWorkoutLogDTO(String name, double weight, int sets, int reps, String time) {
        this.name = name;
        this.weight = weight;
        this.sets = sets;
        this.reps = reps;
        this.time = time;
    }

    public String getName() {
        return name;
    }

    public double getWeight() {
        return weight;
    }

    public int getSets() {
        return sets;
    }

    public int getReps() {
        return reps;
    }

    public String getTime() {
        return time;
    }
}
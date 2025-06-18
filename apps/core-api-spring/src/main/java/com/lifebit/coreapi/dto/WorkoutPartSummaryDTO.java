package com.lifebit.coreapi.dto;

public class WorkoutPartSummaryDTO {
    private String bodyPart;
    private int count;

    public WorkoutPartSummaryDTO() {}

    public WorkoutPartSummaryDTO(String bodyPart, int count) {
        this.bodyPart = bodyPart;
        this.count = count;
    }

    public String getBodyPart() {
        return bodyPart;
    }

    public int getCount() {
        return count;
    }
}
package com.lifebit.coreapi.dto;

import com.lifebit.coreapi.entity.ExerciseSession;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseRecordDTO {

    private Long sessionId;
    private String exerciseName;
    private Integer sets;
    private Integer reps;
    private BigDecimal weight;
    private Integer durationMinutes;
    private Integer caloriesBurned;
    private LocalDate exerciseDate;

    public ExerciseRecordDTO(ExerciseSession session) {
        this.sessionId = session.getExerciseSessionId();
        this.exerciseName = session.getExerciseCatalog().getName();
        this.sets = session.getSets();
        this.reps = session.getReps();
        this.weight = session.getWeight();
        this.durationMinutes = session.getDurationMinutes();
        this.caloriesBurned = session.getCaloriesBurned();
        this.exerciseDate = session.getExerciseDate();
    }
}
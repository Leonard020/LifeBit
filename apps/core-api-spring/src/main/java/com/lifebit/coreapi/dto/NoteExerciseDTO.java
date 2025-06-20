package com.lifebit.coreapi.dto;

import com.lifebit.coreapi.entity.ExerciseSession;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NoteExerciseDTO {

    private LocalDate workoutDate;
    private int totalSets = 0;
    private int totalReps = 0;
    private BigDecimal totalWeight = BigDecimal.ZERO;
    private List<String> exerciseNames = new ArrayList<>();

    public NoteExerciseDTO(LocalDate date) {
        this.workoutDate = date;
    }

    public void addSession(ExerciseSession session) {
        this.totalSets += session.getSets();
        this.totalReps += session.getReps();
        this.totalWeight = this.totalWeight.add(session.getWeight());
        this.exerciseNames.add(session.getExerciseCatalog().getName());
    }
}
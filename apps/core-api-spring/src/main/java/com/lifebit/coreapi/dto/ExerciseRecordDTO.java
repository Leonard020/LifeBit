package com.lifebit.coreapi.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.lifebit.coreapi.entity.ExerciseSession;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL) // null 필드 제외
public class ExerciseRecordDTO {

    private Long userId;
    private Long exerciseSessionId;
    private String exerciseName;
    private String bodyPart;
    private Integer sets;
    private Integer reps;
    private Double weight;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate exerciseDate;

    private Integer durationMinutes;

    @JsonProperty("calories_burned")
    private Integer caloriesBurned;

    public ExerciseRecordDTO(ExerciseSession session) {
        this.exerciseSessionId = session.getExerciseSessionId();
        this.userId = session.getUser() != null ? session.getUser().getUserId() : null;

        if (session.getExerciseCatalog() != null) {
            this.exerciseName = session.getExerciseCatalog().getName();
            this.bodyPart = session.getExerciseCatalog().getBodyPart() != null
                ? session.getExerciseCatalog().getBodyPart().name()
                : "미지정";
        } else {
            this.exerciseName = "이름없음";
            this.bodyPart = "미지정";
        }

        this.sets = session.getSets();
        this.reps = session.getReps();
        this.weight = session.getWeight() != null ? session.getWeight().doubleValue() : null;
        this.exerciseDate = session.getExerciseDate();
        this.durationMinutes = session.getDurationMinutes();
        this.caloriesBurned = session.getCaloriesBurned();
    }
}
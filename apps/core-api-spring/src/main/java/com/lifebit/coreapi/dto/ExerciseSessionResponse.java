package com.lifebit.coreapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.lifebit.coreapi.entity.ExerciseSession;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class ExerciseSessionResponse {

    @JsonProperty("exercise_session_id")
    private Long exerciseSessionId;

    private String uuid;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("exercise_catalog_id")
    private Long exerciseCatalogId;

    @JsonProperty("exercise_name")
    private String exerciseName;

    @JsonProperty("duration_minutes")
    private Integer durationMinutes;

    @JsonProperty("calories_burned")
    private Integer caloriesBurned;

    private Double weight;

    private Integer reps;
    private Integer sets;
    private String notes;

    @JsonProperty("exercise_date")
    private String exerciseDate;

    @JsonProperty("time_period")
    private String timePeriod;

    @JsonProperty("created_at")
    private String createdAt;

    public ExerciseSessionResponse(ExerciseSession session) {
        this.exerciseSessionId = session.getExerciseSessionId();
        this.uuid = session.getUuid() != null ? session.getUuid().toString() : null;
        this.userId = (session.getUser() != null) ? session.getUser().getUserId() : null;
        this.exerciseCatalogId = (session.getExerciseCatalog() != null)
                ? session.getExerciseCatalog().getExerciseCatalogId()
                : null;
        this.exerciseName = (session.getExerciseCatalog() != null) ? session.getExerciseCatalog().getName() : "기타";

        this.durationMinutes = session.getDurationMinutes();
        this.caloriesBurned = session.getCaloriesBurned();
        this.weight = session.getWeight() != null ? session.getWeight().doubleValue() : null;
        this.reps = session.getReps();
        this.sets = session.getSets();
        this.notes = session.getNotes();
        this.exerciseDate = session.getExerciseDate() != null ? session.getExerciseDate().toString() : null;
        this.timePeriod = (session.getTimePeriod() != null) ? session.getTimePeriod().name() : null;
        this.createdAt = session.getCreatedAt() != null ? session.getCreatedAt().toString() : null;
    }
}
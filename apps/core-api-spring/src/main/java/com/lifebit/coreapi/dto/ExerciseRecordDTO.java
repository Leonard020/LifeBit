package com.lifebit.coreapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("exercise_session_id")
    private Long sessionId;

    @JsonProperty("name")
    private String exerciseName;

    private Integer sets;
    private Integer reps;
    private BigDecimal weight;

    private Long userId;
    private String time;  // 사용자가 입력한 운동 시간 (예: "20분")

    private LocalDate exerciseDate;

    @JsonProperty("formatted_time")
    private String durationFormatted;  // 서버에서 가공된 시간 포맷 출력용

    public ExerciseRecordDTO(ExerciseSession session) {
        this.sessionId = session.getExerciseSessionId();
        this.exerciseName = session.getExerciseCatalog().getName();
        this.sets = session.getSets();
        this.reps = session.getReps();
        this.weight = session.getWeight();
        this.exerciseDate = session.getExerciseDate();
        this.durationFormatted = session.getDurationMinutes() != null
                ? session.getDurationMinutes() + "분"
                : null;
    }
}
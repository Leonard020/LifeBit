package com.lifebit.coreapi.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "daily_workout_logs")
public class DailyWorkoutLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dailyWorkoutLogId;

    @ManyToOne
    @JoinColumn(name = "exercise_catalog_id")
    private ExerciseCatalog exerciseCatalog;

    @Column(nullable = false)
    private Long userId;

    private int durationMinutes;
    private int sets;
    private int reps;
    private double weight;

    @Column(name = "workout_date")
    private LocalDate workoutDate;

    public DailyWorkoutLog() {}

    public DailyWorkoutLog(Long dailyWorkoutLogId, ExerciseCatalog exerciseCatalog, Long userId,
                           int durationMinutes, int sets, int reps, double weight, LocalDate workoutDate) {
        this.dailyWorkoutLogId = dailyWorkoutLogId;
        this.exerciseCatalog = exerciseCatalog;
        this.userId = userId;
        this.durationMinutes = durationMinutes;
        this.sets = sets;
        this.reps = reps;
        this.weight = weight;
        this.workoutDate = workoutDate;
    }

    public Long getDailyWorkoutLogId() {
        return dailyWorkoutLogId;
    }

    public ExerciseCatalog getExerciseCatalog() {
        return exerciseCatalog;
    }

    public Long getUserId() {
        return userId;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public int getSets() {
        return sets;
    }

    public int getReps() {
        return reps;
    }

    public double getWeight() {
        return weight;
    }

    public LocalDate getWorkoutDate() {
        return workoutDate;
    }
}
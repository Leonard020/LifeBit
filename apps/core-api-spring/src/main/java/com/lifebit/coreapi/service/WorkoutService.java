package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.WorkoutDTO;
import com.lifebit.coreapi.entity.Workout;
import com.lifebit.coreapi.repository.WorkoutRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkoutService {

    private final WorkoutRepository workoutRepository;

    public WorkoutService(WorkoutRepository workoutRepository) {
        this.workoutRepository = workoutRepository;
    }

    public List<WorkoutDTO> getWorkoutsByDate(LocalDate date) {
        List<Workout> workouts = workoutRepository.findByDate(date);
        return workouts.stream().map(workout -> new WorkoutDTO(
                workout.getId(),
                workout.getDate(),
                workout.getExerciseName(),
                workout.getType(),
                workout.getDuration(),
                workout.getReps(),
                workout.getSets(),
                workout.getWeight(),
                workout.getCaloriesBurned()
        )).collect(Collectors.toList());
    }

    // DB 연결 테스트용
    public long countWorkouts() {
        return workoutRepository.count();
    }
}
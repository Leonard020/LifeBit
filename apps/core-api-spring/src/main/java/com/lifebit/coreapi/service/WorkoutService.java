package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.WorkoutDTO;
import com.lifebit.coreapi.entity.Workout;
import com.lifebit.coreapi.repository.WorkoutRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkoutService {

    @Autowired
    private WorkoutRepository workoutRepository;

    public List<WorkoutDTO> getWorkoutsByUserAndDate(Long userId, LocalDate date) {
        List<Workout> workouts = workoutRepository.findByUserIdAndDate(userId, date);

        // Workout → WorkoutDTO로 변환
        return workouts.stream()
                .map(workout -> new WorkoutDTO(
                        workout.getExerciseName(),
                        workout.getPart(),
                        workout.getSets(),
                        workout.getReps(),
                        workout.getWeight()
                ))
                .collect(Collectors.toList());
    }
}
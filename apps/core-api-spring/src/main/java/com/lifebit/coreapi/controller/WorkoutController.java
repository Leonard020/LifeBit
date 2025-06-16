package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.WorkoutDTO;
import com.lifebit.coreapi.service.WorkoutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/workouts")
public class WorkoutController {

    @Autowired
    private WorkoutService workoutService;

    @GetMapping
    public List<WorkoutDTO> getWorkoutByUserAndDate(
            @RequestParam Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return workoutService.getWorkoutsByUserAndDate(userId, date);
    }
}
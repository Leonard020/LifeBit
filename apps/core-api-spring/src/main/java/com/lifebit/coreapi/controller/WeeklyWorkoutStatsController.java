package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.WorkoutPartSummaryDTO;
import com.lifebit.coreapi.service.WeeklyWorkoutStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/weekly-workouts")
@RequiredArgsConstructor
public class WeeklyWorkoutStatsController {

    private final WeeklyWorkoutStatsService weeklyWorkoutStatsService;

    @GetMapping("/summary")
    public Map<String, Integer> getWeeklySummary(
            @RequestParam Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart
    ) {
        List<WorkoutPartSummaryDTO> summary = weeklyWorkoutStatsService.getWeeklySummary(userId, weekStart);
        Map<String, Integer> result = new HashMap<>();
        for (WorkoutPartSummaryDTO dto : summary) {
            result.put(dto.getBodyPart(), dto.getCount());
        }
        return result;
    }
}
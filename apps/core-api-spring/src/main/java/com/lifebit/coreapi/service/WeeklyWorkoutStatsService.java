package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.WorkoutPartSummaryDTO;
import com.lifebit.coreapi.entity.DailyWorkoutLog;
import com.lifebit.coreapi.repository.DailyWorkoutLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class WeeklyWorkoutStatsService {

    private final DailyWorkoutLogRepository dailyWorkoutLogRepository;

    public WeeklyWorkoutStatsService(DailyWorkoutLogRepository repo) {
        this.dailyWorkoutLogRepository = repo;
    }

    public List<WorkoutPartSummaryDTO> getWeeklySummary(Long userId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        List<DailyWorkoutLog> logs = dailyWorkoutLogRepository.findByUserIdAndWorkoutDateBetween(userId, weekStart, weekEnd);

        Map<String, Integer> counter = new HashMap<>();

        for (DailyWorkoutLog log : logs) {
            String bodyPart = log.getExerciseCatalog().getBodyPart().name(); // enum을 String으로 변환
            counter.put(bodyPart, counter.getOrDefault(bodyPart, 0) + 1);
        }

        List<WorkoutPartSummaryDTO> result = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : counter.entrySet()) {
            result.add(new WorkoutPartSummaryDTO(entry.getKey(), entry.getValue()));
        }

        return result;
    }
}
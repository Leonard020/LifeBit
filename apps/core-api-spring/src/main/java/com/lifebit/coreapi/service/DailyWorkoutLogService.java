package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.DailyWorkoutLogDTO;
import com.lifebit.coreapi.entity.DailyWorkoutLog;
import com.lifebit.coreapi.repository.DailyWorkoutLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DailyWorkoutLogService {

    private final DailyWorkoutLogRepository dailyWorkoutLogRepository;

    public DailyWorkoutLogService(DailyWorkoutLogRepository dailyWorkoutLogRepository) {
        this.dailyWorkoutLogRepository = dailyWorkoutLogRepository;
    }

    public List<DailyWorkoutLogDTO> getDailyWorkoutLogs(String dateStr, Long userId) {
        LocalDate date = LocalDate.parse(dateStr);
        List<DailyWorkoutLog> logs = dailyWorkoutLogRepository.findByWorkoutDateAndUserId(date, userId);

        return logs.stream().map(log -> new DailyWorkoutLogDTO(
                log.getExerciseCatalog().getName(),  // 운동 이름
                log.getWeight(),
                log.getSets(),
                log.getReps(),
                log.getDurationMinutes() + "분"      // time 필드는 직접 조립
        )).collect(Collectors.toList());
    }

    public long countLogs() {
        return dailyWorkoutLogRepository.count();
    }
}
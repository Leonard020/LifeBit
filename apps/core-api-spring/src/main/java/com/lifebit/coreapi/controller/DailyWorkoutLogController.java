package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.DailyWorkoutLogDTO;
import com.lifebit.coreapi.service.DailyWorkoutLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/daily-workouts")
@RequiredArgsConstructor
public class DailyWorkoutLogController {

    private final DailyWorkoutLogService dailyWorkoutLogService;

    // 날짜와 사용자 ID로 오늘의 운동 기록 조회
    @GetMapping
    public ResponseEntity<List<DailyWorkoutLogDTO>> getDailyWorkoutLogs(
            @RequestParam String date,
            @RequestParam Long userId
    ) {
        List<DailyWorkoutLogDTO> logs = dailyWorkoutLogService.getDailyWorkoutLogs(date, userId);
        return ResponseEntity.ok(logs);
    }
}
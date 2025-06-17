package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.WorkoutDTO;
import com.lifebit.coreapi.service.WorkoutService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/workouts")
@CrossOrigin(origins = "*")
public class WorkoutController {

    private final WorkoutService workoutService;

    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    // ✅ 운동 데이터 조회
    @GetMapping
    public List<WorkoutDTO> getWorkoutsByDate(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return workoutService.getWorkoutsByDate(date);
    }

    // ✅ DB 연결 테스트
    @GetMapping("/test-db")
    public ResponseEntity<String> testDatabaseConnection() {
        try {
            long count = workoutService.countWorkouts();
            return ResponseEntity.ok("운동 기록 수: " + count);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("DB 연결 실패: " + e.getMessage());
        }
    }
}
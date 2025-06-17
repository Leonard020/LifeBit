package com.lifebit.coreapi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exercise-sessions")
public class ExerciseSessionController {

    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getExerciseSessions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period) {
        
        // Mock 운동 세션 데이터 반환
        List<Map<String, Object>> mockSessions = List.of(
            Map.of(
                "session_id", 1,
                "uuid", "550e8400-e29b-41d4-a716-446655440300",
                "user_id", userId,
                "exercise_catalog_id", 1,
                "exercise_name", "런닝",
                "duration_minutes", 30,
                "calories_burned", 250,
                "notes", "아침 조깅",
                "exercise_date", LocalDate.now().minusDays(1).toString(),
                "created_at", LocalDateTime.now().minusDays(1).toString()
            ),
            Map.of(
                "session_id", 2,
                "uuid", "550e8400-e29b-41d4-a716-446655440301",
                "user_id", userId,
                "exercise_catalog_id", 2,
                "exercise_name", "웨이트 트레이닝",
                "duration_minutes", 45,
                "calories_burned", 180,
                "notes", "상체 운동",
                "exercise_date", LocalDate.now().toString(),
                "created_at", LocalDateTime.now().toString()
            )
        );
        
        return ResponseEntity.ok(mockSessions);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createExerciseSession(
            @RequestBody Map<String, Object> request) {
        
        // Mock 응답 데이터
        Map<String, Object> response = Map.of(
            "session_id", 3,
            "uuid", "550e8400-e29b-41d4-a716-446655440302",
            "user_id", request.get("user_id"),
            "exercise_catalog_id", request.get("exercise_catalog_id"),
            "duration_minutes", request.get("duration_minutes"),
            "calories_burned", request.get("calories_burned"),
            "notes", request.getOrDefault("notes", ""),
            "exercise_date", request.get("exercise_date"),
            "created_at", LocalDateTime.now().toString()
        );
        
        return ResponseEntity.ok(response);
    }
} 
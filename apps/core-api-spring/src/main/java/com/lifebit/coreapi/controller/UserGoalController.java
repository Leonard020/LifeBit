package com.lifebit.coreapi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/user-goals")
public class UserGoalController {

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getUserGoals(@PathVariable Long userId) {
        
        // Mock 사용자 목표 데이터 반환
        Map<String, Object> mockGoals = Map.of(
            "goal_id", 1,
            "uuid", "550e8400-e29b-41d4-a716-446655440100",
            "user_id", userId,
            "weekly_workout_target", 5,
            "daily_carbs_target", 250.0,
            "daily_protein_target", 120.0,
            "daily_fat_target", 80.0,
            "created_at", LocalDateTime.now().minusDays(30).toString(),
            "updated_at", LocalDateTime.now().toString()
        );
        
        return ResponseEntity.ok(mockGoals);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> updateUserGoals(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request) {
        
        // Mock 업데이트된 목표 데이터 반환
        Map<String, Object> updatedGoals = Map.of(
            "goal_id", 1,
            "uuid", "550e8400-e29b-41d4-a716-446655440100",
            "user_id", userId,
            "weekly_workout_target", request.getOrDefault("weekly_workout_target", 5),
            "daily_carbs_target", request.getOrDefault("daily_carbs_target", 250.0),
            "daily_protein_target", request.getOrDefault("daily_protein_target", 120.0),
            "daily_fat_target", request.getOrDefault("daily_fat_target", 80.0),
            "created_at", LocalDateTime.now().minusDays(30).toString(),
            "updated_at", LocalDateTime.now().toString()
        );
        
        return ResponseEntity.ok(updatedGoals);
    }
} 
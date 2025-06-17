package com.lifebit.coreapi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meal-logs")
public class MealLogController {

    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getMealLogs(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period) {
        
        // Mock 식단 로그 데이터 반환
        Map<String, Object> log1 = Map.of(
            "meal_log_id", 1,
            "uuid", "550e8400-e29b-41d4-a716-446655440400",
            "user_id", userId,
            "food_item_id", 1,
            "food_name", "닭가슴살",
            "quantity", new BigDecimal("150.0"),
            "log_date", LocalDate.now().minusDays(1).toString(),
            "created_at", LocalDateTime.now().minusDays(1).toString()
        );
        
        Map<String, Object> log2 = Map.of(
            "meal_log_id", 2,
            "uuid", "550e8400-e29b-41d4-a716-446655440401",
            "user_id", userId,
            "food_item_id", 2,
            "food_name", "현미밥",
            "quantity", new BigDecimal("200.0"),
            "log_date", LocalDate.now().toString(),
            "created_at", LocalDateTime.now().toString()
        );
        
        List<Map<String, Object>> mockLogs = List.of(log1, log2);
        
        return ResponseEntity.ok(mockLogs);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createMealLog(
            @RequestBody Map<String, Object> request) {
        
        // Mock 응답 데이터
        Map<String, Object> response = Map.of(
            "meal_log_id", 3,
            "uuid", "550e8400-e29b-41d4-a716-446655440402",
            "user_id", request.get("user_id"),
            "food_item_id", request.get("food_item_id"),
            "quantity", request.get("quantity"),
            "log_date", request.get("log_date"),
            "created_at", LocalDateTime.now().toString()
        );
        
        return ResponseEntity.ok(response);
    }
} 
package com.lifebit.coreapi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/health-records")
public class HealthRecordController {

    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getHealthRecords(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period) {
        
        // Mock 데이터 반환
        List<Map<String, Object>> mockData = List.of(
            Map.of(
                "health_record_id", 1,
                "uuid", "550e8400-e29b-41d4-a716-446655440000",
                "user_id", userId,
                "weight", 70.5,
                "bmi", 22.3,
                "record_date", LocalDate.now().minusDays(1).toString(),
                "created_at", LocalDateTime.now().minusDays(1).toString()
            ),
            Map.of(
                "health_record_id", 2,
                "uuid", "550e8400-e29b-41d4-a716-446655440001",
                "user_id", userId,
                "weight", 71.0,
                "bmi", 22.5,
                "record_date", LocalDate.now().toString(),
                "created_at", LocalDateTime.now().toString()
            )
        );
        
        return ResponseEntity.ok(mockData);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createHealthRecord(
            @RequestBody Map<String, Object> request) {
        
        // Mock 응답 데이터
        Map<String, Object> response = Map.of(
            "health_record_id", 3,
            "uuid", "550e8400-e29b-41d4-a716-446655440002",
            "user_id", request.get("user_id"),
            "weight", request.get("weight"),
            "bmi", request.get("bmi"),
            "record_date", request.get("record_date"),
            "created_at", LocalDateTime.now().toString()
        );
        
        return ResponseEntity.ok(response);
    }
} 
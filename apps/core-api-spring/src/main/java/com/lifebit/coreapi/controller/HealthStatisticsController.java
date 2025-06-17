package com.lifebit.coreapi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/health-statistics")
public class HealthStatisticsController {

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getHealthStatistics(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period) {
        
        // Mock 통계 데이터 반환
        Map<String, Object> mockStatistics = Map.of(
            "total_records", 15,
            "average_weight", 70.8,
            "average_bmi", 22.4,
            "weight_trend", "stable",
            "bmi_category", "정상",
            "goal_completion_rate", 85.5
        );
        
        return ResponseEntity.ok(mockStatistics);
    }
} 
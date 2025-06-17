package com.lifebit.coreapi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getRecommendations(@PathVariable Long userId) {
        
        // Mock 추천 데이터 반환
        List<Map<String, Object>> mockRecommendations = List.of(
            Map.of(
                "recommendation_id", 1,
                "uuid", "550e8400-e29b-41d4-a716-446655440200",
                "user_id", userId,
                "recommendation_type", "exercise",
                "title", "주간 운동량 증가 권장",
                "description", "현재 주 3회 운동하고 계시는데, 목표 달성을 위해 주 4-5회로 늘려보세요.",
                "priority", "high",
                "created_at", LocalDateTime.now().minusHours(2).toString()
            ),
            Map.of(
                "recommendation_id", 2,
                "uuid", "550e8400-e29b-41d4-a716-446655440201",
                "user_id", userId,
                "recommendation_type", "nutrition",
                "title", "단백질 섭취량 조절",
                "description", "일일 단백질 목표량 대비 부족합니다. 닭가슴살이나 두부 섭취를 늘려보세요.",
                "priority", "medium",
                "created_at", LocalDateTime.now().minusHours(1).toString()
            ),
            Map.of(
                "recommendation_id", 3,
                "uuid", "550e8400-e29b-41d4-a716-446655440202",
                "user_id", userId,
                "recommendation_type", "health",
                "title", "수분 섭취 증가",
                "description", "하루 물 섭취량을 2L 이상으로 늘려 신진대사를 활성화하세요.",
                "priority", "low",
                "created_at", LocalDateTime.now().minusMinutes(30).toString()
            )
        );
        
        return ResponseEntity.ok(mockRecommendations);
    }

    @PostMapping("/{userId}/feedback")
    public ResponseEntity<Map<String, String>> submitFeedback(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> feedback) {
        
        // Mock 피드백 응답
        Map<String, String> response = Map.of(
            "status", "success",
            "message", "피드백이 성공적으로 제출되었습니다."
        );
        
        return ResponseEntity.ok(response);
    }
} 
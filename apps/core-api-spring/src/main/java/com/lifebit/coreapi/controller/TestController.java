package com.lifebit.coreapi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/hello")
    public ResponseEntity<Map<String, String>> hello() {
        return ResponseEntity.ok(Map.of("message", "Hello from LifeBit API!"));
    }

    @GetMapping("/ranking")
    public ResponseEntity<Map<String, Object>> testRanking() {
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Ranking API is working!",
            "data", Map.of(
                "rank", 1,
                "score", 100,
                "nickname", "테스트사용자"
            )
        ));
    }
} 
package com.lifebit.coreapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/py/chat")
@RequiredArgsConstructor
public class ChatController {

    private final RestTemplate restTemplate;
    
    @Value("${ai.api.url:http://localhost:8001}")
    private String aiApiUrl;

    @PostMapping
    public ResponseEntity<?> handleChatMessage(@RequestBody Map<String, Object> request) {
        try {
            // FastAPI로 요청 전달
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                aiApiUrl + "/api/py/chat",
                HttpMethod.POST,
                new org.springframework.http.HttpEntity<>(request),
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "메시지 처리 중 오류가 발생했습니다: " + e.getMessage());
            error.put("type", "chat");
            return ResponseEntity.badRequest().body(error);
        }
    }
} 
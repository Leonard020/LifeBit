package com.lifebit.coreapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    @PostMapping
    public ResponseEntity<?> handleChatMessage(@RequestBody Map<String, Object> request) {
        try {
            String message = (String) request.get("message");
            @SuppressWarnings("unchecked")
            var conversationHistory = (java.util.List<Map<String, String>>) request.get("conversation_history");

            // TODO: 실제 AI 처리 로직 구현
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "메시지를 받았습니다: " + message);
            response.put("type", "chat");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "메시지 처리 중 오류가 발생했습니다: " + e.getMessage());
            error.put("type", "chat");
            return ResponseEntity.badRequest().body(error);
        }
    }
} 
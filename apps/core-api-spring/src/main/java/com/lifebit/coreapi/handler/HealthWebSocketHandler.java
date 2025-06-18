package com.lifebit.coreapi.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 건강 데이터 실시간 업데이트를 위한 WebSocket 핸들러
 * 사용자별 세션을 관리하고 실시간 업데이트 메시지를 전송
 */
@Slf4j
@Component
public class HealthWebSocketHandler extends TextWebSocketHandler {

    // 사용자별 WebSocket 세션 저장
    private final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = extractUserIdFromSession(session);
        if (userId != null) {
            userSessions.put(userId, session);
            log.info("🔗 WebSocket 연결 성공 - 사용자 ID: {}, 세션 ID: {}", userId, session.getId());
            
            // 연결 성공 메시지 전송
            sendWelcomeMessage(session, userId);
        } else {
            log.warn("⚠️ 유효하지 않은 사용자 ID - 연결 종료");
            session.close(CloseStatus.BAD_DATA);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = extractUserIdFromSession(session);
        if (userId != null) {
            userSessions.remove(userId);
            log.info("❌ WebSocket 연결 종료 - 사용자 ID: {}, 상태: {}", userId, status);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        String userId = extractUserIdFromSession(session);
        log.error("🚨 WebSocket 전송 오류 - 사용자 ID: {}, 오류: {}", userId, exception.getMessage());
        
        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String userId = extractUserIdFromSession(session);
        log.info("📨 메시지 수신 - 사용자 ID: {}, 메시지: {}", userId, message.getPayload());
        
        // 클라이언트에서 ping 메시지를 보낸 경우 pong으로 응답
        if ("ping".equals(message.getPayload())) {
            sendMessage(session, "pong");
        }
    }

    /**
     * 특정 사용자에게 건강 기록 업데이트 메시지 전송
     */
    public void sendHealthRecordUpdate(String userId, Object data) {
        sendUpdateMessage(userId, "health_record_update", data);
    }

    /**
     * 특정 사용자에게 운동 세션 업데이트 메시지 전송
     */
    public void sendExerciseSessionUpdate(String userId, Object data) {
        sendUpdateMessage(userId, "exercise_session_update", data);
    }

    /**
     * 특정 사용자에게 추천 업데이트 메시지 전송
     */
    public void sendRecommendationUpdate(String userId, Object data) {
        sendUpdateMessage(userId, "recommendation_update", data);
    }

    /**
     * 업데이트 메시지 전송 (내부 메서드)
     */
    private void sendUpdateMessage(String userId, String type, Object data) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                HealthUpdateMessage message = HealthUpdateMessage.builder()
                        .type(type)
                        .userId(userId)
                        .data(data)
                        .timestamp(LocalDateTime.now().toString())
                        .build();
                
                String jsonMessage = objectMapper.writeValueAsString(message);
                sendMessage(session, jsonMessage);
                
                log.info("📤 업데이트 메시지 전송 - 사용자 ID: {}, 타입: {}", userId, type);
            } catch (Exception e) {
                log.error("🚨 메시지 전송 실패 - 사용자 ID: {}, 오류: {}", userId, e.getMessage());
            }
        }
    }

    /**
     * 연결 환영 메시지 전송
     */
    private void sendWelcomeMessage(WebSocketSession session, String userId) {
        try {
            WelcomeMessage welcome = WelcomeMessage.builder()
                    .message("LifeBit 실시간 업데이트에 연결되었습니다.")
                    .userId(userId)
                    .timestamp(LocalDateTime.now().toString())
                    .build();
            
            String jsonMessage = objectMapper.writeValueAsString(welcome);
            sendMessage(session, jsonMessage);
        } catch (Exception e) {
            log.error("🚨 환영 메시지 전송 실패 - 사용자 ID: {}, 오류: {}", userId, e.getMessage());
        }
    }

    /**
     * WebSocket 세션에 메시지 전송
     */
    private void sendMessage(WebSocketSession session, String message) throws IOException {
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(message));
        }
    }

    /**
     * WebSocket 세션에서 사용자 ID 추출
     * URL 패턴: /ws/health/{userId}
     */
    private String extractUserIdFromSession(WebSocketSession session) {
        try {
            String path = session.getUri().getPath();
            String[] pathSegments = path.split("/");
            
            // /ws/health/{userId} 패턴에서 userId 추출
            if (pathSegments.length >= 3 && "ws".equals(pathSegments[1]) && "health".equals(pathSegments[2])) {
                return pathSegments[3];
            }
        } catch (Exception e) {
            log.error("🚨 사용자 ID 추출 실패: {}", e.getMessage());
        }
        return null;
    }

    /**
     * 현재 연결된 사용자 수 반환
     */
    public int getConnectedUserCount() {
        return userSessions.size();
    }

    /**
     * 특정 사용자가 연결되어 있는지 확인
     */
    public boolean isUserConnected(String userId) {
        WebSocketSession session = userSessions.get(userId);
        return session != null && session.isOpen();
    }

    /**
     * 건강 업데이트 메시지 DTO
     */
    @lombok.Builder
    @lombok.Data
    public static class HealthUpdateMessage {
        private String type;
        private String userId;
        private Object data;
        private String timestamp;
    }

    /**
     * 환영 메시지 DTO
     */
    @lombok.Builder
    @lombok.Data
    public static class WelcomeMessage {
        private String message;
        private String userId;
        private String timestamp;
    }
} 
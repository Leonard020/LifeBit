package com.lifebit.coreapi.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifebit.coreapi.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
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
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        log.info("🔗 [WebSocket] 연결 시도 - URI: {}, 세션 ID: {}", session.getUri(), session.getId());
        
        // JWT 토큰 검증
        String userId = validateAndExtractUserId(session);
        if (userId != null) {
            userSessions.put(userId, session);
            log.info("✅ [WebSocket] 연결 성공 - 사용자 ID: {}, 세션 ID: {}", userId, session.getId());
            
            // 연결 성공 메시지 전송 (안전하게 처리)
            try {
                // 환영 메시지는 선택적으로 전송 (클라이언트에서 요청할 때만)
                // sendWelcomeMessage(session, userId);
                log.info("✅ [WebSocket] 연결 완료 - 사용자 ID: {}", userId);
            } catch (Exception e) {
                log.warn("⚠️ [WebSocket] 환영 메시지 전송 실패 (연결은 유지됨) - 사용자 ID: {}, 오류: {}", userId, e.getMessage());
                // 환영 메시지 전송 실패는 연결 종료의 이유가 되지 않음
            }
        } else {
            log.error("❌ [WebSocket] 인증 실패 - 연결 종료, URI: {}", session.getUri());
            session.close(CloseStatus.POLICY_VIOLATION);
        }
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) throws Exception {
        String userId = extractUserIdFromSession(session);
        if (userId != null) {
            userSessions.remove(userId);
            log.info("❌ WebSocket 연결 종료 - 사용자 ID: {}, 상태: {}", userId, status);
        }
    }

    @Override
    public void handleTransportError(@NonNull WebSocketSession session, @NonNull Throwable exception) throws Exception {
        String userId = extractUserIdFromSession(session);
        log.error("🚨 WebSocket 전송 오류 - 사용자 ID: {}, 오류: {}", userId, exception.getMessage());
        
        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) throws Exception {
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
            // 세션이 여전히 열려있는지 확인
            if (session == null || !session.isOpen()) {
                log.warn("세션이 닫혀있어 환영 메시지를 전송할 수 없습니다. 사용자 ID: {}", userId);
                return;
            }
            
            WelcomeMessage welcome = WelcomeMessage.builder()
                    .message("LifeBit 실시간 업데이트에 연결되었습니다.")
                    .userId(userId)
                    .timestamp(LocalDateTime.now().toString())
                    .build();
            
            String jsonMessage = objectMapper.writeValueAsString(welcome);
            sendMessage(session, jsonMessage);
            
            log.info("✅ 환영 메시지 전송 성공 - 사용자 ID: {}", userId);
        } catch (Exception e) {
            log.error("🚨 환영 메시지 전송 실패 - 사용자 ID: {}, 오류: {}", userId, e.getMessage());
            // 오류가 발생해도 연결은 유지
        }
    }

    /**
     * WebSocket 세션에 메시지 전송
     */
    private void sendMessage(WebSocketSession session, String message) throws IOException {
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(message));
            } catch (IOException e) {
                log.warn("메시지 전송 중 연결이 끊어짐 - 세션 ID: {}, 오류: {}", session.getId(), e.getMessage());
                throw e;
            }
        } else {
            log.warn("세션이 닫혀있어 메시지를 전송할 수 없습니다.");
            throw new IOException("WebSocket session is closed");
        }
    }

    /**
     * JWT 토큰 검증 및 사용자 ID 추출
     */
    private String validateAndExtractUserId(WebSocketSession session) {
        try {
            // URI null 체크
            if (session == null || session.getUri() == null) {
                log.error("❌ [WebSocket] 세션 또는 URI가 null입니다.");
                return null;
            }
            
            log.info("🔍 [WebSocket] 연결 검증 시작 - URI: {}", session.getUri());
            
            // URL에서 토큰 파라미터 추출
            String query = session.getUri().getQuery();
            if (query == null || !query.contains("token=")) {
                log.error("❌ [WebSocket] JWT 토큰이 없습니다. Query: {}", query);
                return null;
            }
            
            String token = query.substring(query.indexOf("token=") + 6);
            if (token.contains("&")) {
                token = token.substring(0, token.indexOf("&"));
            }
            
            // URL 디코딩
            try {
                token = java.net.URLDecoder.decode(token, "UTF-8");
            } catch (Exception e) {
                log.error("❌ [WebSocket] 토큰 URL 디코딩 실패: {}", e.getMessage());
                return null;
            }
            
            log.info("🔑 [WebSocket] 토큰 추출 완료 - 길이: {}", token.length());
            
            // JWT 토큰 검증
            if (!jwtTokenProvider.validateToken(token)) {
                log.error("❌ [WebSocket] 유효하지 않은 JWT 토큰입니다.");
                return null;
            }
            
            log.info("✅ [WebSocket] JWT 토큰 검증 성공");
            
            // 토큰에서 사용자 ID 추출
            Long userIdLong = jwtTokenProvider.getUserIdFromToken(token);
            if (userIdLong == null) {
                log.error("❌ [WebSocket] 토큰에서 사용자 ID를 추출할 수 없습니다.");
                return null;
            }
            String userId = userIdLong.toString();
            
            log.info("👤 [WebSocket] 토큰에서 사용자 ID 추출: {}", userId);
            
            // URL 경로의 사용자 ID와 토큰의 사용자 ID 일치 확인
            String pathUserId = extractUserIdFromPath(session);
            log.info("🛣️ [WebSocket] 경로에서 사용자 ID 추출: {}", pathUserId);
            
            if (pathUserId == null) {
                log.error("❌ [WebSocket] 경로에서 사용자 ID를 추출할 수 없습니다.");
                return null;
            }
            
            if (!userId.equals(pathUserId)) {
                log.error("❌ [WebSocket] 경로의 사용자 ID({})와 토큰의 사용자 ID({})가 일치하지 않습니다.", pathUserId, userId);
                return null;
            }
            
            log.info("✅ [WebSocket] 사용자 ID 검증 성공: {}", userId);
            return userId;
            
        } catch (Exception e) {
            log.error("❌ [WebSocket] JWT 토큰 검증 중 오류 발생: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * URL 경로에서 사용자 ID 추출
     */
    private String extractUserIdFromPath(WebSocketSession session) {
        try {
            // URI null 체크
            if (session == null || session.getUri() == null) {
                log.warn("WebSocket 세션 또는 URI가 null입니다.");
                return null;
            }
            
            String path = session.getUri().getPath();
            if (path == null) {
                log.warn("WebSocket 세션 경로가 null입니다.");
                return null;
            }
            
            String[] pathSegments = path.split("/");
            
            // /ws/health/{userId} 패턴에서 userId 추출
            if (pathSegments.length >= 3 && "ws".equals(pathSegments[1]) && "health".equals(pathSegments[2])) {
                return pathSegments[3];
            }
        } catch (Exception e) {
            log.error("경로에서 사용자 ID 추출 실패: {}", e.getMessage());
        }
        return null;
    }

    /**
     * WebSocket 세션에서 사용자 ID 추출 (기존 메서드 - 하위 호환성 유지)
     */
    private String extractUserIdFromSession(WebSocketSession session) {
        try {
            // URI null 체크
            if (session.getUri() == null) {
                log.warn("WebSocket 세션 URI가 null입니다.");
                return null;
            }
            return extractUserIdFromPath(session);
        } catch (Exception e) {
            log.error("세션에서 사용자 ID 추출 실패: {}", e.getMessage());
            return null;
        }
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
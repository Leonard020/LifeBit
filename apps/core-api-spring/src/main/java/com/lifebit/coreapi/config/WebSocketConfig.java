package com.lifebit.coreapi.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import com.lifebit.coreapi.handler.HealthWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * WebSocket 설정 클래스
 * 실시간 건강 데이터 업데이트를 위한 WebSocket 엔드포인트 설정
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private HealthWebSocketHandler healthWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // 여러 패턴으로 등록하여 호환성 확보
        registry.addHandler(healthWebSocketHandler, "/ws/health/{userId}")
                .setAllowedOrigins("http://localhost:5173", "http://localhost:3000") // CORS 설정
                .setAllowedOriginPatterns("*"); // 모든 Origin 허용 (개발용)
        
        // 추가 패턴 등록
        registry.addHandler(healthWebSocketHandler, "/ws/health/**")
                .setAllowedOrigins("http://localhost:5173", "http://localhost:3000")
                .setAllowedOriginPatterns("*");
    }
} 
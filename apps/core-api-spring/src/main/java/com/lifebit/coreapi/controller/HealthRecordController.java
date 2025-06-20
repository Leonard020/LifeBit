package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.service.HealthRecordService;
import com.lifebit.coreapi.service.HealthStatisticsService;
import com.lifebit.coreapi.entity.HealthRecord;
import com.lifebit.coreapi.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/health-records")
@RequiredArgsConstructor
@Slf4j
public class HealthRecordController {

    private final HealthRecordService healthRecordService;
    private final HealthStatisticsService healthStatisticsService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * JWT 토큰에서 사용자 ID 추출
     */
    private Long getUserIdFromToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("JWT token not found");
    }

    /**
     * 건강 기록 조회 (통합 서비스 사용)
     * 
     * 2024-12-31: HealthStatisticsService로 리팩토링됨
     * - 일관된 응답 형식
     * - 중복 로직 제거
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getHealthRecords(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period,
            HttpServletRequest request) {
        
        try {
            log.info("건강 기록 조회 요청 - 사용자: {}, 기간: {}", userId, period);
            
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 🔐 인증된 사용자만 자신의 데이터에 접근 가능
            if (!tokenUserId.equals(userId)) {
                log.warn("권한 없는 접근 시도 - 토큰 사용자: {}, 요청 사용자: {}", tokenUserId, userId);
                return ResponseEntity.status(403).build();
            }
            
            // ✅ 통합된 서비스에서 건강 기록 조회
            List<Map<String, Object>> healthRecordsData = healthStatisticsService.getHealthRecords(tokenUserId, period);
            
            log.info("건강 기록 조회 완료 - 사용자: {}, 기간: {}, 개수: {}", 
                tokenUserId, period, healthRecordsData.size());
            
            return ResponseEntity.ok(healthRecordsData);
            
        } catch (RuntimeException e) {
            log.error("건강 기록 조회 중 오류 발생 - 사용자: {}, 기간: {}, 오류: {}", 
                userId, period, e.getMessage());
            
            // 오류 발생 시 빈 리스트 반환
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createHealthRecord(
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        
        try {
            log.info("건강 기록 생성 요청: {}", request);
            
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(httpRequest);
            
            // 요청 데이터에서 HealthRecord 엔티티 생성
            HealthRecord healthRecord = new HealthRecord();
            healthRecord.setUserId(tokenUserId); // 토큰에서 가져온 사용자 ID 사용
            
            if (request.get("weight") != null) {
                healthRecord.setWeight(new java.math.BigDecimal(request.get("weight").toString()));
            }
            if (request.get("height") != null) {
                healthRecord.setHeight(new java.math.BigDecimal(request.get("height").toString()));
            }
            if (request.get("record_date") != null) {
                healthRecord.setRecordDate(LocalDate.parse(request.get("record_date").toString()));
            } else {
                healthRecord.setRecordDate(LocalDate.now());
            }
            
            // 데이터베이스에 저장
            HealthRecord savedRecord = healthRecordService.createHealthRecord(healthRecord);
            
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("health_record_id", savedRecord.getHealthRecordId());
            response.put("uuid", savedRecord.getUuid().toString());
            response.put("user_id", savedRecord.getUserId());
            response.put("weight", savedRecord.getWeight() != null ? savedRecord.getWeight().doubleValue() : null);
            response.put("height", savedRecord.getHeight() != null ? savedRecord.getHeight().doubleValue() : null);
            response.put("bmi", savedRecord.getBmi() != null ? savedRecord.getBmi().doubleValue() : null);
            response.put("record_date", savedRecord.getRecordDate().toString());
            response.put("created_at", savedRecord.getCreatedAt().toString());
            
            log.info("건강 기록 생성 완료 - ID: {}", savedRecord.getHealthRecordId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("건강 기록 생성 중 오류 발생: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "건강 기록 생성에 실패했습니다.");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
} 
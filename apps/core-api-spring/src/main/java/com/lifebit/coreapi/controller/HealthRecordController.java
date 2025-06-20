package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.service.HealthRecordService;
import com.lifebit.coreapi.entity.HealthRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getHealthRecords(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period) {
        
        try {
            log.info("건강 기록 조회 요청 - 사용자: {}, 기간: {}", userId, period);
            
            // 실제 데이터베이스에서 건강 기록 조회
            List<HealthRecord> healthRecords;
            
            // 기간에 따른 데이터 조회
            switch (period.toLowerCase()) {
                case "day":
                    healthRecords = healthRecordService.getRecentHealthRecords(userId, 1);
                    break;
                case "week":
                    healthRecords = healthRecordService.getRecentHealthRecords(userId, 7);
                    break;
                case "month":
                    healthRecords = healthRecordService.getRecentHealthRecords(userId, 30);
                    break;
                case "year":
                    healthRecords = healthRecordService.getRecentHealthRecords(userId, 365);
                    break;
                default:
                    healthRecords = healthRecordService.getRecentHealthRecords(userId, 30);
            }
            
            // HealthRecord 엔티티를 Map으로 변환
            List<Map<String, Object>> healthRecordsData = healthRecords.stream()
                .map(record -> {
                    Map<String, Object> recordMap = new HashMap<>();
                    recordMap.put("health_record_id", record.getHealthRecordId());
                    recordMap.put("uuid", record.getUuid().toString());
                    recordMap.put("user_id", record.getUserId());
                    recordMap.put("weight", record.getWeight() != null ? record.getWeight().doubleValue() : null);
                    recordMap.put("height", record.getHeight() != null ? record.getHeight().doubleValue() : null);
                    recordMap.put("bmi", record.getBmi() != null ? record.getBmi().doubleValue() : null);
                    recordMap.put("record_date", record.getRecordDate().toString());
                    recordMap.put("created_at", record.getCreatedAt().toString());
                    return recordMap;
                })
                .toList();
            
            log.info("건강 기록 조회 완료 - 사용자: {}, 기간: {}, 개수: {}", 
                userId, period, healthRecordsData.size());
            
            return ResponseEntity.ok(healthRecordsData);
            
        } catch (Exception e) {
            log.error("건강 기록 조회 중 오류 발생 - 사용자: {}, 기간: {}, 오류: {}", 
                userId, period, e.getMessage(), e);
            
            // 오류 발생 시 빈 리스트 반환
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createHealthRecord(
            @RequestBody Map<String, Object> request) {
        
        try {
            log.info("건강 기록 생성 요청: {}", request);
            
            // 요청 데이터에서 HealthRecord 엔티티 생성
            HealthRecord healthRecord = new HealthRecord();
            healthRecord.setUserId(Long.valueOf(request.get("user_id").toString()));
            
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
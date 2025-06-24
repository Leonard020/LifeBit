package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.DietLogDTO;
import com.lifebit.coreapi.dto.DietNutritionDTO;
import com.lifebit.coreapi.dto.DietCalendarDTO;
import com.lifebit.coreapi.service.DietService;
import com.lifebit.coreapi.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diet")
@RequiredArgsConstructor
@Slf4j
public class DietController {
    private final DietService dietService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * JWT 토큰에서 사용자 ID 추출
     */
    private Long getUserIdFromToken(HttpServletRequest request) {
        try {
            String bearerToken = request.getHeader("Authorization");
            if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                String token = bearerToken.substring(7);
                return jwtTokenProvider.getUserIdFromToken(token);
            }
            throw new RuntimeException("JWT token not found");
        } catch (Exception e) {
            log.error("JWT 토큰 파싱 실패: {}", e.getMessage());
            throw new RuntimeException("JWT token parsing failed: " + e.getMessage());
        }
    }

    @GetMapping("/daily-records/{date}")
    public ResponseEntity<List<DietLogDTO>> getDailyRecords(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, 
            @RequestParam Long userId,
            HttpServletRequest request) {
        try {
            // JWT 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 권한 확인: 자신의 데이터만 조회 가능
            if (!tokenUserId.equals(userId)) {
                log.warn("권한 없는 접근 시도 - 토큰 사용자: {}, 요청 사용자: {}", tokenUserId, userId);
                return ResponseEntity.status(403).build();
            }
            
            List<DietLogDTO> records = dietService.getDailyDietRecords(date, userId);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            log.error("일일 식단 기록 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/nutrition-goals/{date}")
    public ResponseEntity<List<DietNutritionDTO>> getNutritionGoals(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, 
            @RequestParam Long userId,
            HttpServletRequest request) {
        try {
            // JWT 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 권한 확인: 자신의 데이터만 조회 가능
            if (!tokenUserId.equals(userId)) {
                log.warn("권한 없는 접근 시도 - 토큰 사용자: {}, 요청 사용자: {}", tokenUserId, userId);
                return ResponseEntity.status(403).build();
            }
            
            List<DietNutritionDTO> goals = dietService.getNutritionGoals(date, userId);
            return ResponseEntity.ok(goals);
        } catch (Exception e) {
            log.error("영양 목표 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/calendar-records/{year}/{month}")
    public ResponseEntity<Map<String, DietCalendarDTO>> getCalendarRecords(
            @PathVariable int year, 
            @PathVariable int month, 
            @RequestParam Long userId,
            HttpServletRequest request) {
        try {
            // JWT 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 권한 확인: 자신의 데이터만 조회 가능
            if (!tokenUserId.equals(userId)) {
                log.warn("권한 없는 접근 시도 - 토큰 사용자: {}, 요청 사용자: {}", tokenUserId, userId);
                return ResponseEntity.status(403).build();
            }
            
            Map<String, DietCalendarDTO> records = dietService.getCalendarRecords(userId, year, month);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            log.error("달력 기록 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/record")
    public ResponseEntity<DietLogDTO> recordDiet(
            @RequestBody DietLogDTO request) {
        DietLogDTO savedRecord = dietService.recordDiet(request);
        return ResponseEntity.ok(savedRecord);
    }

    @PutMapping("/record/{id}")
    public ResponseEntity<DietLogDTO> updateDietRecord(
            @PathVariable Long id,
            @RequestBody DietLogDTO request) {
        DietLogDTO updatedRecord = dietService.updateDietRecord(id, request);
        return ResponseEntity.ok(updatedRecord);
    }

    @DeleteMapping("/record/{id}")
    public ResponseEntity<Void> deleteDietRecord(@PathVariable Long id) {
        dietService.deleteDietRecord(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/food-items/search")
    public ResponseEntity<List<Map<String, Object>>> searchFoodItems(
            @RequestParam String keyword) {
        List<Map<String, Object>> foodItems = dietService.searchFoodItems(keyword);
        return ResponseEntity.ok(foodItems);
    }
} 
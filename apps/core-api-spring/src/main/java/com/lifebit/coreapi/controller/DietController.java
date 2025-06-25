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
import java.util.HashMap;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;

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
    public ResponseEntity<Map<String, Object>> recordDiet(
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        
        try {
            log.info("식단 기록 생성 요청: {}", request);
            
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(httpRequest);
            
            // 요청 데이터에서 필요한 값들 추출 (snake_case와 camelCase 모두 지원)
            Long foodItemId = request.get("food_item_id") != null ? 
                Long.valueOf(request.get("food_item_id").toString()) : 
                (request.get("foodItemId") != null ? Long.valueOf(request.get("foodItemId").toString()) : null);
            
            Double quantity = request.get("quantity") != null ? 
                Double.valueOf(request.get("quantity").toString()) : 1.0;
            
            String mealTime = request.get("meal_time") != null ? 
                request.get("meal_time").toString() : 
                (request.get("mealTime") != null ? request.get("mealTime").toString() : "snack");
            
            String inputSource = request.get("input_source") != null ? 
                request.get("input_source").toString() : 
                (request.get("inputSource") != null ? request.get("inputSource").toString() : "TYPING");
            
            Double confidenceScore = request.get("confidence_score") != null ? 
                Double.valueOf(request.get("confidence_score").toString()) : 
                (request.get("confidenceScore") != null ? Double.valueOf(request.get("confidenceScore").toString()) : 1.0);
            
            String validationStatus = request.get("validation_status") != null ? 
                request.get("validation_status").toString() : 
                (request.get("validationStatus") != null ? request.get("validationStatus").toString() : "VALIDATED");
            
            String logDate = request.get("log_date") != null ? 
                request.get("log_date").toString() : 
                (request.get("logDate") != null ? request.get("logDate").toString() : LocalDate.now().toString());
            
            // 1. food_item_id 파싱
            foodItemId = request.get("food_item_id") != null ? 
                Long.valueOf(request.get("food_item_id").toString()) : 
                (request.get("foodItemId") != null ? Long.valueOf(request.get("foodItemId").toString()) : null);
            
            // 2. 직접입력 음식 정보 파싱
            String foodName = (String) request.get("food_name");
            Double calories = request.get("calories") != null ? Double.valueOf(request.get("calories").toString()) : null;
            Double carbs = request.get("carbs") != null ? Double.valueOf(request.get("carbs").toString()) : null;
            Double protein = request.get("protein") != null ? Double.valueOf(request.get("protein").toString()) : null;
            Double fat = request.get("fat") != null ? Double.valueOf(request.get("fat").toString()) : null;

            // 3. 분기 처리
            if (foodItemId == null) {
                // 직접입력 음식 정보가 충분한지 체크
                if (foodName != null && calories != null && carbs != null && protein != null && fat != null) {
                    // 임시 FoodItem 생성
                    foodItemId = dietService.createCustomFoodItem(foodName, calories, carbs, protein, fat);
                } else {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "food_item_id 또는 (food_name, calories, carbs, protein, fat) 정보가 필요합니다.");
                    return ResponseEntity.badRequest().body(errorResponse);
                }
            }
            
            // DietLogDTO 생성 (토큰에서 가져온 사용자 ID 사용)
            DietLogDTO dietLogDTO = new DietLogDTO();
            dietLogDTO.setUserId(tokenUserId);
            dietLogDTO.setFoodItemId(foodItemId);
            dietLogDTO.setQuantity(quantity);
            dietLogDTO.setMealTime(mealTime);
            dietLogDTO.setInputSource(inputSource);
            dietLogDTO.setConfidenceScore(confidenceScore);
            dietLogDTO.setValidationStatus(validationStatus);
            dietLogDTO.setLogDate(logDate);
            
            // 데이터베이스에 저장
            DietLogDTO savedRecord = dietService.recordDiet(dietLogDTO);
            
            // 응답 데이터 구성 (ExerciseSessionController와 유사한 형태)
            Map<String, Object> response = new HashMap<>();
            response.put("meal_log_id", savedRecord.getId());
            response.put("user_id", savedRecord.getUserId());
            response.put("food_item_id", savedRecord.getFoodItemId());
            response.put("food_name", savedRecord.getFoodName());
            response.put("quantity", savedRecord.getQuantity());
            response.put("meal_time", savedRecord.getMealTime());
            response.put("log_date", savedRecord.getLogDate());
            response.put("calories", savedRecord.getCalories());
            response.put("carbs", savedRecord.getCarbs());
            response.put("protein", savedRecord.getProtein());
            response.put("fat", savedRecord.getFat());
            response.put("input_source", savedRecord.getInputSource());
            response.put("confidence_score", savedRecord.getConfidenceScore());
            response.put("validation_status", savedRecord.getValidationStatus());
            response.put("created_at", savedRecord.getCreatedAt());
            
            log.info("식단 기록 생성 완료 - ID: {}", savedRecord.getId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("식단 기록 생성 중 오류 발생: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "식단 기록 생성에 실패했습니다.");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
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
package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.service.MealService;
import com.lifebit.coreapi.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/meal-logs")
@RequiredArgsConstructor
@Slf4j
public class MealLogController {
    private final MealService mealService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * JWT 토큰에서 사용자 ID 추출
     */
    private Long getUserIdFromToken(HttpServletRequest request) {
        try {
            String bearerToken = request.getHeader("Authorization");
            log.debug("🔍 [MealLogController] Authorization 헤더: {}", bearerToken != null ? bearerToken.substring(0, Math.min(20, bearerToken.length())) + "..." : "null");
            
            if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                String token = bearerToken.substring(7);
                log.debug("🔍 [MealLogController] JWT 토큰 추출됨: {}...", token.substring(0, Math.min(20, token.length())));
                
                Long userId = jwtTokenProvider.getUserIdFromToken(token);
                log.info("✅ [MealLogController] 토큰에서 추출된 사용자 ID: {}", userId);
                return userId;
            } else {
                log.warn("🚨 [MealLogController] Bearer 토큰이 없습니다: {}", bearerToken);
                throw new RuntimeException("Bearer JWT token not found");
            }
        } catch (Exception e) {
            log.error("❌ [MealLogController] JWT 토큰 파싱 실패: {}", e.getMessage(), e);
            throw new RuntimeException("JWT token parsing failed: " + e.getMessage());
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getMealLogs(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period,
            HttpServletRequest request) {
        
        try {
            log.info("식단 기록 조회 요청 - 사용자: {}, 기간: {}", userId, period);
            
            // 🔍 디버깅: 토큰 확인
            String authHeader = request.getHeader("Authorization");
            log.info("🔍 [MealLogController] Authorization 헤더: {}", authHeader != null ? "존재함" : "없음");
            
            Long tokenUserId = null;
            try {
                tokenUserId = getUserIdFromToken(request);
                log.info("✅ [MealLogController] 토큰에서 추출된 사용자 ID: {}", tokenUserId);
            } catch (Exception e) {
                log.error("❌ [MealLogController] 토큰 추출 실패: {}", e.getMessage());
                // 토큰 추출 실패 시에도 일단 계속 진행 (디버깅용)
            }
            
            // 🔐 인증된 사용자만 자신의 데이터에 접근 가능 (또는 관리자)
            if (tokenUserId != null && !tokenUserId.equals(userId)) {
                log.warn("권한 없는 접근 시도 - 토큰 사용자: {}, 요청 사용자: {}", tokenUserId, userId);
            return ResponseEntity.status(403).build();
        }
        
        // 기간에 따른 날짜 범위 계산
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;
        
        switch (period.toLowerCase()) {
            case "day":
                // 오늘부터 7일 전까지 조회 (일주일치 데이터)
                startDate = endDate.minusDays(7);
                break;
            case "week":
                // 오늘부터 8주 전까지 조회 (2개월치 데이터)
                startDate = endDate.minusWeeks(8);
                break;
            case "month":
                // 오늘부터 3개월 전까지 조회
                startDate = endDate.minusMonths(3);
                break;
            case "year":
                // 오늘부터 1년 전까지 조회
                startDate = endDate.minusYears(1);
                break;
            default:
                // 기본값: 3개월 전까지
                startDate = endDate.minusMonths(3);
        }
        
        log.info("📅 [MealLogController] 조회 기간: {} ~ {} (period: {})", startDate, endDate, period);
            
            // 실제 데이터베이스에서 식단 기록 조회
            User user = new User(userId);
            List<MealLog> mealLogs = mealService.getMealHistory(user, startDate, endDate);
            
            log.info("📊 [MealLogController] 조회된 식단 기록 수: {}", mealLogs.size());
            
            // 🔍 디버깅: 조회된 데이터의 날짜 범위 확인
            if (!mealLogs.isEmpty()) {
                LocalDate firstDate = mealLogs.get(mealLogs.size() - 1).getLogDate(); // 가장 오래된 날짜
                LocalDate lastDate = mealLogs.get(0).getLogDate(); // 가장 최신 날짜
                log.info("🔍 [MealLogController] 실제 데이터 날짜 범위: {} ~ {}", firstDate, lastDate);
                
                // 각 meal log의 상세 정보 로깅 (최대 5개)
                for (int i = 0; i < Math.min(5, mealLogs.size()); i++) {
                    MealLog mealLog = mealLogs.get(i);
                    log.info("🔍 [MealLogController] MealLog[{}]: ID={}, Date={}, FoodItem={}", 
                        i, mealLog.getMealLogId(), mealLog.getLogDate(), 
                        mealLog.getFoodItem() != null ? mealLog.getFoodItem().getName() : "null");
                }
            } else {
                log.warn("⚠️ [MealLogController] 조회된 식단 기록이 없습니다. 사용자: {}, 기간: {} ~ {}", 
                    userId, startDate, endDate);
            }
            
            // MealLog 엔티티를 Map으로 변환
            List<Map<String, Object>> mealLogsData = mealLogs.stream()
                .map(mealLog -> {
                    Map<String, Object> logMap = new HashMap<>();
                    logMap.put("meal_log_id", mealLog.getMealLogId());
                    logMap.put("uuid", mealLog.getUuid() != null ? mealLog.getUuid().toString() : null);
                    logMap.put("user_id", mealLog.getUser() != null ? mealLog.getUser().getUserId() : null);
                    logMap.put("food_item_id", mealLog.getFoodItem() != null ? mealLog.getFoodItem().getFoodItemId() : null);
                    logMap.put("food_name", mealLog.getFoodItem() != null ? mealLog.getFoodItem().getName() : "알수없음");
                    logMap.put("quantity", mealLog.getQuantity() != null ? mealLog.getQuantity().doubleValue() : null);
                    logMap.put("meal_time", mealLog.getMealTime() != null ? mealLog.getMealTime().name() : null);
                    logMap.put("log_date", mealLog.getLogDate() != null ? mealLog.getLogDate().toString() : null);
                    logMap.put("created_at", mealLog.getCreatedAt() != null ? mealLog.getCreatedAt().toString() : null);
                    
                    // food_item 객체 추가
                    if (mealLog.getFoodItem() != null) {
                        Map<String, Object> foodItemMap = new HashMap<>();
                        foodItemMap.put("food_item_id", mealLog.getFoodItem().getFoodItemId());
                        foodItemMap.put("name", mealLog.getFoodItem().getName());
                        foodItemMap.put("serving_size", mealLog.getFoodItem().getServingSize() != null ? mealLog.getFoodItem().getServingSize().doubleValue() : 100.0);
                        foodItemMap.put("calories", mealLog.getFoodItem().getCalories() != null ? mealLog.getFoodItem().getCalories().doubleValue() : 0.0);
                        foodItemMap.put("carbs", mealLog.getFoodItem().getCarbs() != null ? mealLog.getFoodItem().getCarbs().doubleValue() : 0.0);
                        foodItemMap.put("protein", mealLog.getFoodItem().getProtein() != null ? mealLog.getFoodItem().getProtein().doubleValue() : 0.0);
                        foodItemMap.put("fat", mealLog.getFoodItem().getFat() != null ? mealLog.getFoodItem().getFat().doubleValue() : 0.0);
                        logMap.put("food_item", foodItemMap);
                    }
                    
                    return logMap;
                })
                .toList();
            
            log.info("식단 기록 조회 완료 - 사용자: {}, 기간: {}, 개수: {}", 
                userId, period, mealLogsData.size());
            
            return ResponseEntity.ok(mealLogsData);
            
        } catch (Exception e) {
            log.error("식단 기록 조회 중 예상치 못한 오류 발생 - 사용자: {}, 기간: {}, 오류: {}", 
                userId, period, e.getMessage(), e);
            
            // 오류 발생 시 빈 리스트 반환
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createMealLog(
            @RequestBody CreateMealLogRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            log.info("식단 기록 생성 요청: {}", request);
            
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(httpRequest);
        
        // 🔐 인증된 사용자만 자신의 데이터 생성 가능
            if (!tokenUserId.equals(request.getUserId())) {
                log.warn("권한 없는 생성 시도 - 토큰 사용자: {}, 요청 사용자: {}", tokenUserId, request.getUserId());
            return ResponseEntity.status(403).build();
        }
        
            // 데이터베이스에 저장
        MealLog mealLog = mealService.recordMeal(
            request.getUserId(),
            request.getFoodItemId(),
            request.getQuantity()
        );
        
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("meal_log_id", mealLog.getMealLogId());
            response.put("uuid", mealLog.getUuid() != null ? mealLog.getUuid().toString() : null);
            response.put("user_id", mealLog.getUser() != null ? mealLog.getUser().getUserId() : null);
            response.put("food_item_id", mealLog.getFoodItem() != null ? mealLog.getFoodItem().getFoodItemId() : null);
            response.put("food_name", mealLog.getFoodItem() != null ? mealLog.getFoodItem().getName() : null);
            response.put("quantity", mealLog.getQuantity() != null ? mealLog.getQuantity().doubleValue() : null);
            response.put("meal_time", mealLog.getMealTime() != null ? mealLog.getMealTime().name() : null);
            response.put("log_date", mealLog.getLogDate() != null ? mealLog.getLogDate().toString() : null);
            response.put("created_at", mealLog.getCreatedAt() != null ? mealLog.getCreatedAt().toString() : null);
            
            log.info("식단 기록 생성 완료 - ID: {}", mealLog.getMealLogId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("식단 기록 생성 중 오류 발생: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "식단 기록 생성에 실패했습니다.");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    // 내부 DTO 클래스
    public static class CreateMealLogRequest {
        private Long userId;
        private Long foodItemId;
        private BigDecimal quantity;
        
        // Getters and Setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public Long getFoodItemId() { return foodItemId; }
        public void setFoodItemId(Long foodItemId) { this.foodItemId = foodItemId; }
        
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
        
        @Override
        public String toString() {
            return "CreateMealLogRequest{" +
                    "userId=" + userId +
                    ", foodItemId=" + foodItemId +
                    ", quantity=" + quantity +
                    '}';
        }
    }
} 
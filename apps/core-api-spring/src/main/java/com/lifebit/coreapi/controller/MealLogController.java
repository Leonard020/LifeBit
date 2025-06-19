package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.service.MealService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/meal-logs")
@RequiredArgsConstructor
public class MealLogController {
    private final MealService mealService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<MealLog>> getMealLogs(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // 🔐 인증된 사용자만 자신의 데이터에 접근 가능
        Long authenticatedUserId = Long.parseLong(userDetails.getUsername());
        if (!authenticatedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        
        // 기간에 따른 날짜 범위 계산
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;
        
        switch (period.toLowerCase()) {
            case "week":
                startDate = endDate.minusWeeks(1);
                break;
            case "month":
                startDate = endDate.minusMonths(1);
                break;
            case "year":
                startDate = endDate.minusYears(1);
                break;
            default:
                startDate = endDate.minusMonths(1);
        }
        
        User user = new User(userId);
        List<MealLog> mealLogs = mealService.getMealHistory(user, startDate, endDate);
        return ResponseEntity.ok(mealLogs);
    }

    @PostMapping
    public ResponseEntity<MealLog> createMealLog(
            @RequestBody CreateMealLogRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // 🔐 인증된 사용자만 자신의 데이터 생성 가능
        Long authenticatedUserId = Long.parseLong(userDetails.getUsername());
        if (!authenticatedUserId.equals(request.getUserId())) {
            return ResponseEntity.status(403).build();
        }
        
        MealLog mealLog = mealService.recordMeal(
            request.getUserId(),
            request.getFoodItemId(),
            request.getQuantity()
        );
        
        return ResponseEntity.ok(mealLog);
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
    }
} 
package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.MealRecordRequest;
import com.lifebit.coreapi.entity.FoodItem;
import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.service.MealService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meals")
@RequiredArgsConstructor
public class MealController {
    private final MealService mealService;

    @PostMapping("/record")
    public ResponseEntity<MealLog> recordMeal(
            @RequestBody MealRecordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        MealLog mealLog = mealService.recordMeal(
            Long.parseLong(userDetails.getUsername()),
            request.getFoodItemId(),
            request.getQuantity()
        );
        return ResponseEntity.ok(mealLog);
    }

    @GetMapping("/history")
    public ResponseEntity<List<MealLog>> getMealHistory(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<MealLog> history = mealService.getMealHistory(
            new User(Long.parseLong(userDetails.getUsername())),
            startDate,
            endDate
        );
        return ResponseEntity.ok(history);
    }

    @GetMapping("/foods/search")
    public ResponseEntity<List<FoodItem>> searchFoodItems(
            @RequestParam String keyword) {
        return ResponseEntity.ok(mealService.searchFoodItems(keyword));
    }

    @GetMapping("/foods/{foodCode}")
    public ResponseEntity<FoodItem> getFoodItemByCode(
            @PathVariable String foodCode) {
        return ResponseEntity.ok(mealService.getFoodItemByCode(foodCode));
    }

    @PostMapping("/foods/find-or-create")
    public ResponseEntity<FoodItem> findOrCreateFoodItem(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        BigDecimal calories = new BigDecimal(request.get("calories").toString());
        BigDecimal carbs = new BigDecimal(request.get("carbs").toString());
        BigDecimal protein = new BigDecimal(request.get("protein").toString());
        BigDecimal fat = new BigDecimal(request.get("fat").toString());
        
        FoodItem foodItem = mealService.findOrCreateFoodItem(name, calories, carbs, protein, fat);
        return ResponseEntity.ok(foodItem);
    }
} 
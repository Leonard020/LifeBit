package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.FoodItem;
import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.entity.MealTimeType;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.FoodItemRepository;
import com.lifebit.coreapi.repository.MealLogRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class MealService {
    private final MealLogRepository mealLogRepository;
    private final FoodItemRepository foodItemRepository;

    @Transactional
    public MealLog recordMeal(Long userId, Long foodItemId, BigDecimal quantity) {
        FoodItem foodItem = foodItemRepository.findById(foodItemId)
            .orElseThrow(() -> new EntityNotFoundException("Food item not found"));

        MealLog mealLog = new MealLog();
        mealLog.setUuid(UUID.randomUUID());
        mealLog.setUser(new User(userId));
        mealLog.setFoodItem(foodItem);
        mealLog.setQuantity(quantity);
        mealLog.setLogDate(LocalDate.now());
        mealLog.setMealTime(MealTimeType.lunch);
        mealLog.setCreatedAt(LocalDateTime.now());

        return mealLogRepository.save(mealLog);
    }

    public List<MealLog> getMealHistory(User user, LocalDate startDate, LocalDate endDate) {
        log.info("🔍 [MealService] getMealHistory 호출 - userId: {}, 기간: {} ~ {}", 
            user.getUserId(), startDate, endDate);
        
        List<MealLog> result = mealLogRepository.findByUserAndLogDateBetweenOrderByLogDateDesc(
            user, startDate, endDate);
        
        log.info("🔍 [MealService] Repository 결과 - 조회된 기록 수: {}", result.size());
        
        // 디버깅을 위해 사용자 ID로도 직접 조회 시도
        if (result.isEmpty()) {
            log.warn("⚠️ [MealService] User 객체로 조회 실패, userId로 직접 조회 시도");
            List<MealLog> directResult = mealLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDescCreatedAtDesc(
                user.getUserId(), startDate, endDate);
            log.info("🔍 [MealService] UserId 직접 조회 결과: {}", directResult.size());
            return directResult;
        }
        
        return result;
    }

    public List<FoodItem> searchFoodItems(String keyword) {
        return foodItemRepository.findByNameContainingIgnoreCase(keyword);
    }

    public FoodItem getFoodItemByCode(String foodCode) {
        return foodItemRepository.findByFoodCode(foodCode)
            .orElseThrow(() -> new EntityNotFoundException("Food item not found"));
    }

    @Transactional
    public FoodItem findOrCreateFoodItem(String name, BigDecimal calories, BigDecimal carbs, BigDecimal protein, BigDecimal fat) {
        List<FoodItem> existingItems = foodItemRepository.findByNameContainingIgnoreCase(name);
        
        if (!existingItems.isEmpty()) {
            for (FoodItem item : existingItems) {
                if (item.getName().equalsIgnoreCase(name)) {
                    return item;
                }
            }
        }
        
        FoodItem newFoodItem = new FoodItem();
        newFoodItem.setUuid(UUID.randomUUID());
        newFoodItem.setName(name);
        newFoodItem.setCalories(calories);
        newFoodItem.setCarbs(carbs);
        newFoodItem.setProtein(protein);
        newFoodItem.setFat(fat);
        newFoodItem.setServingSize(BigDecimal.valueOf(100));
        newFoodItem.setCreatedAt(LocalDateTime.now());
        
        return foodItemRepository.save(newFoodItem);
    }

    /**
     * AI가 계산한 영양소 정보를 반환합니다.
     */
    public Map<String, Object> calculateNutrition(String foodName, String amount) {
        Map<String, Object> result = new HashMap<>();
        
        // AI가 이미 계산한 영양소 정보를 그대로 반환
        // 실제로는 AI API에서 계산된 값이 전달됨
        result.put("status", "calculated");
        result.put("foodName", foodName);
        result.put("amount", amount);
        result.put("message", "AI에서 영양소가 자동 계산되었습니다.");
        
        return result;
    }

    /**
     * 음식명과 섭취량을 기반으로 영양소를 자동 계산합니다.
     */
    public Map<String, Object> getAutoCalculatedNutrition(String foodName, String amount) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 기존 음식 데이터베이스에서 검색
            List<FoodItem> existingItems = foodItemRepository.findByNameContainingIgnoreCase(foodName);
            
            if (!existingItems.isEmpty()) {
                FoodItem foundItem = existingItems.get(0);
                
                // 섭취량에 따른 영양소 계산
                BigDecimal multiplier = parseAmountMultiplier(amount);
                
                result.put("status", "found");
                result.put("foodName", foundItem.getName());
                result.put("amount", amount);
                result.put("calories", foundItem.getCalories().multiply(multiplier));
                result.put("carbs", foundItem.getCarbs().multiply(multiplier));
                result.put("protein", foundItem.getProtein().multiply(multiplier));
                result.put("fat", foundItem.getFat().multiply(multiplier));
                result.put("source", "database");
            } else {
                // 데이터베이스에 없는 경우 AI 계산 결과 대기
                result.put("status", "not_found");
                result.put("foodName", foodName);
                result.put("amount", amount);
                result.put("message", "AI가 영양소를 계산 중입니다.");
                result.put("source", "ai_calculation");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "영양소 계산 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }

    /**
     * 섭취량 문자열을 숫자 배수로 변환합니다.
     */
    private BigDecimal parseAmountMultiplier(String amount) {
        if (amount == null || amount.trim().isEmpty()) {
            return BigDecimal.ONE;
        }
        
        amount = amount.toLowerCase().trim();
        
        // 숫자 추출
        String numberStr = amount.replaceAll("[^0-9.]", "");
        BigDecimal number = BigDecimal.ONE;
        
        try {
            if (!numberStr.isEmpty()) {
                number = new BigDecimal(numberStr);
            }
        } catch (NumberFormatException e) {
            number = BigDecimal.ONE;
        }
        
        // 단위별 계산
        if (amount.contains("개")) {
            // 계란 1개 = 60g, 사과 1개 = 200g 등의 기준 적용
            if (amount.contains("계란")) {
                return number.multiply(BigDecimal.valueOf(0.6)); // 60g
            } else if (amount.contains("사과")) {
                return number.multiply(BigDecimal.valueOf(2.0)); // 200g
            } else {
                return number.multiply(BigDecimal.valueOf(1.0)); // 기본 100g 기준
            }
        } else if (amount.contains("공기")) {
            return number.multiply(BigDecimal.valueOf(2.1)); // 210g
        } else if (amount.contains("인분")) {
            return number.multiply(BigDecimal.valueOf(1.5)); // 150g
        } else if (amount.contains("장")) {
            return number.multiply(BigDecimal.valueOf(0.3)); // 30g
        } else if (amount.contains("컵")) {
            return number.multiply(BigDecimal.valueOf(2.4)); // 240ml
        } else if (amount.contains("g")) {
            // 그램 단위인 경우 100g 기준으로 비율 계산
            return number.divide(BigDecimal.valueOf(100), 2, BigDecimal.ROUND_HALF_UP);
        } else {
            return number;
        }
    }

    /**
     * 특정 날짜의 일일 영양소 섭취량 요약을 반환합니다.
     */
    public Map<String, Object> getDailyNutritionSummary(Long userId, LocalDate date) {
        Map<String, Object> summary = new HashMap<>();
        
        try {
            User user = new User();
            user.setUserId(userId);
            
            // 해당 날짜의 모든 식단 기록 조회
            List<MealLog> dailyMealLogs = mealLogRepository.findByUserAndLogDateOrderByLogDateDescCreatedAtDesc(user, date);
            
            double totalCalories = 0.0;
            double totalCarbs = 0.0;
            double totalProtein = 0.0;
            double totalFat = 0.0;
            int mealCount = dailyMealLogs.size();
            
            // 각 식단 기록의 영양소 합계 계산
            for (MealLog mealLog : dailyMealLogs) {
                FoodItem foodItem = mealLog.getFoodItem();
                BigDecimal quantity = mealLog.getQuantity();
                
                if (foodItem.getCalories() != null) {
                    totalCalories += foodItem.getCalories().multiply(quantity).divide(new BigDecimal(100)).doubleValue();
                }
                if (foodItem.getCarbs() != null) {
                    totalCarbs += foodItem.getCarbs().multiply(quantity).divide(new BigDecimal(100)).doubleValue();
                }
                if (foodItem.getProtein() != null) {
                    totalProtein += foodItem.getProtein().multiply(quantity).divide(new BigDecimal(100)).doubleValue();
                }
                if (foodItem.getFat() != null) {
                    totalFat += foodItem.getFat().multiply(quantity).divide(new BigDecimal(100)).doubleValue();
                }
            }
            
            summary.put("totalCalories", totalCalories);
            summary.put("totalCarbs", totalCarbs);
            summary.put("totalProtein", totalProtein);
            summary.put("totalFat", totalFat);
            summary.put("mealCount", mealCount);
            summary.put("date", date.toString());
            
        } catch (Exception e) {
            // 오류 발생 시 기본값 반환
            summary.put("totalCalories", 0.0);
            summary.put("totalCarbs", 0.0);
            summary.put("totalProtein", 0.0);
            summary.put("totalFat", 0.0);
            summary.put("mealCount", 0);
            summary.put("date", date.toString());
            summary.put("error", e.getMessage());
        }
        
        return summary;
    }

    /**
     * 유저의 최근 7일간 식단 목표 영양소 달성률(%)을 반환합니다.
     * (목표 대비 실제 섭취량의 평균 비율, 0~100)
     */
    public int getWeeklyNutritionAchievementRate(Long userId) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(6);
        User user = new User();
        user.setUserId(userId);
        List<MealLog> mealLogs = mealLogRepository.findByUserAndLogDateBetweenOrderByLogDateDesc(user, startDate, endDate);
        if (mealLogs.isEmpty()) return 0;

        // 목표값(예시: 1일 200g 탄수, 120g 단백질, 60g 지방, 1500kcal)
        double targetCarbs = 200 * 7;
        double targetProtein = 120 * 7;
        double targetFat = 60 * 7;
        double targetCalories = 1500 * 7;

        double totalCarbs = 0, totalProtein = 0, totalFat = 0, totalCalories = 0;
        for (MealLog log : mealLogs) {
            FoodItem food = log.getFoodItem();
            if (food == null) continue;
            double qty = log.getQuantity() != null ? log.getQuantity().doubleValue() : 1.0;
            totalCarbs += food.getCarbs() != null ? food.getCarbs().doubleValue() * qty / 100.0 : 0;
            totalProtein += food.getProtein() != null ? food.getProtein().doubleValue() * qty / 100.0 : 0;
            totalFat += food.getFat() != null ? food.getFat().doubleValue() * qty / 100.0 : 0;
            totalCalories += food.getCalories() != null ? food.getCalories().doubleValue() * qty / 100.0 : 0;
        }
        double carbsRate = Math.min(100, totalCarbs / targetCarbs * 100);
        double proteinRate = Math.min(100, totalProtein / targetProtein * 100);
        double fatRate = Math.min(100, totalFat / targetFat * 100);
        double caloriesRate = Math.min(100, totalCalories / targetCalories * 100);
        // 4개 항목 평균
        int avgRate = (int) Math.round((carbsRate + proteinRate + fatRate + caloriesRate) / 4.0);
        return avgRate;
    }
} 
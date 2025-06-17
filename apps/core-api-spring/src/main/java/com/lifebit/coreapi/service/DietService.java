package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.DietLogDTO;
import com.lifebit.coreapi.dto.DietNutritionDTO;
import com.lifebit.coreapi.entity.FoodItem;
import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.FoodItemRepository;
import com.lifebit.coreapi.repository.MealLogRepository;
import com.lifebit.coreapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DietService {
    private final MealLogRepository mealLogRepository;
    private final FoodItemRepository foodItemRepository;
    private final UserRepository userRepository;

    public List<DietLogDTO> getDailyDietRecords(Long userId, LocalDate date) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<MealLog> mealLogs = mealLogRepository.findByUserAndLogDateOrderByCreatedAtDesc(user, date);
        
        return mealLogs.stream()
            .map(this::convertToDietLogDTO)
            .collect(Collectors.toList());
    }

    public List<DietNutritionDTO> getNutritionGoals(Long userId, LocalDate date) {
        // 기본 영양소 목표 설정 (실제로는 사용자별 목표를 DB에서 가져와야 함)
        List<DietNutritionDTO> goals = List.of(
            new DietNutritionDTO("칼로리", 2000.0, 0.0, "kcal", 0.0),
            new DietNutritionDTO("탄수화물", 250.0, 0.0, "g", 0.0),
            new DietNutritionDTO("단백질", 150.0, 0.0, "g", 0.0),
            new DietNutritionDTO("지방", 67.0, 0.0, "g", 0.0)
        );

        // 해당 날짜의 실제 섭취량 계산
        List<MealLog> dailyMealLogs = getDailyDietRecords(userId, date).stream()
            .map(this::convertToMealLog)
            .collect(Collectors.toList());

        double totalCalories = 0.0;
        double totalCarbs = 0.0;
        double totalProtein = 0.0;
        double totalFat = 0.0;

        for (MealLog mealLog : dailyMealLogs) {
            FoodItem foodItem = mealLog.getFoodItem();
            BigDecimal quantity = mealLog.getQuantity();
            
            if (foodItem.getCalories() != null) {
                totalCalories += foodItem.getCalories().multiply(quantity).doubleValue();
            }
            if (foodItem.getCarbs() != null) {
                totalCarbs += foodItem.getCarbs().multiply(quantity).doubleValue();
            }
            if (foodItem.getProtein() != null) {
                totalProtein += foodItem.getProtein().multiply(quantity).doubleValue();
            }
            if (foodItem.getFat() != null) {
                totalFat += foodItem.getFat().multiply(quantity).doubleValue();
            }
        }

        // 목표 대비 백분율 계산
        return List.of(
            new DietNutritionDTO("칼로리", 2000.0, totalCalories, "kcal", 
                calculatePercentage(totalCalories, 2000.0)),
            new DietNutritionDTO("탄수화물", 250.0, totalCarbs, "g", 
                calculatePercentage(totalCarbs, 250.0)),
            new DietNutritionDTO("단백질", 150.0, totalProtein, "g", 
                calculatePercentage(totalProtein, 150.0)),
            new DietNutritionDTO("지방", 67.0, totalFat, "g", 
                calculatePercentage(totalFat, 67.0))
        );
    }

    @Transactional
    public DietLogDTO recordDiet(DietLogDTO request) {
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        FoodItem foodItem = foodItemRepository.findById(request.getFoodItemId())
            .orElseThrow(() -> new RuntimeException("Food item not found"));

        MealLog mealLog = new MealLog();
        mealLog.setUuid(UUID.randomUUID());
        mealLog.setUser(user);
        mealLog.setFoodItem(foodItem);
        mealLog.setQuantity(BigDecimal.valueOf(request.getQuantity()));
        mealLog.setLogDate(LocalDate.parse(request.getLogDate()));
        mealLog.setCreatedAt(LocalDateTime.now());

        MealLog savedMealLog = mealLogRepository.save(mealLog);
        return convertToDietLogDTO(savedMealLog);
    }

    @Transactional
    public void deleteDietRecord(Long id) {
        mealLogRepository.deleteById(id);
    }

    private DietLogDTO convertToDietLogDTO(MealLog mealLog) {
        DietLogDTO dto = new DietLogDTO();
        dto.setId(mealLog.getMealLogId());
        dto.setUserId(mealLog.getUser().getUserId());
        dto.setFoodItemId(mealLog.getFoodItem().getFoodItemId());
        dto.setFoodName(mealLog.getFoodItem().getName());
        dto.setQuantity(mealLog.getQuantity().doubleValue());
        dto.setLogDate(mealLog.getLogDate().toString());
        dto.setUnit("g"); // 기본 단위
        
        // 영양소 정보 설정
        FoodItem foodItem = mealLog.getFoodItem();
        if (foodItem.getCalories() != null) {
            dto.setCalories(foodItem.getCalories().multiply(mealLog.getQuantity()).doubleValue());
        }
        if (foodItem.getCarbs() != null) {
            dto.setCarbs(foodItem.getCarbs().multiply(mealLog.getQuantity()).doubleValue());
        }
        if (foodItem.getProtein() != null) {
            dto.setProtein(foodItem.getProtein().multiply(mealLog.getQuantity()).doubleValue());
        }
        if (foodItem.getFat() != null) {
            dto.setFat(foodItem.getFat().multiply(mealLog.getQuantity()).doubleValue());
        }
        
        return dto;
    }

    private MealLog convertToMealLog(DietLogDTO dto) {
        MealLog mealLog = new MealLog();
        mealLog.setMealLogId(dto.getId());
        mealLog.setQuantity(BigDecimal.valueOf(dto.getQuantity()));
        mealLog.setLogDate(LocalDate.parse(dto.getLogDate()));
        
        FoodItem foodItem = new FoodItem();
        foodItem.setFoodItemId(dto.getFoodItemId());
        foodItem.setName(dto.getFoodName());
        foodItem.setCalories(BigDecimal.valueOf(dto.getCalories()));
        foodItem.setCarbs(BigDecimal.valueOf(dto.getCarbs()));
        foodItem.setProtein(BigDecimal.valueOf(dto.getProtein()));
        foodItem.setFat(BigDecimal.valueOf(dto.getFat()));
        
        mealLog.setFoodItem(foodItem);
        return mealLog;
    }

    private double calculatePercentage(double current, double target) {
        if (target == 0) return 0;
        return Math.min((current / target) * 100, 100);
    }
} 
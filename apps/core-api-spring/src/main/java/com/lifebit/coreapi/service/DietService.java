package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.DietLogDTO;
import com.lifebit.coreapi.dto.DietNutritionDTO;
import com.lifebit.coreapi.dto.DietCalendarDTO;
import com.lifebit.coreapi.entity.FoodItem;
import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.entity.UserGoal;
import com.lifebit.coreapi.repository.FoodItemRepository;
import com.lifebit.coreapi.repository.MealLogRepository;
import com.lifebit.coreapi.repository.UserRepository;
import com.lifebit.coreapi.repository.UserGoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DietService {
    private final MealLogRepository mealLogRepository;
    private final FoodItemRepository foodItemRepository;
    private final UserRepository userRepository;
    private final UserGoalRepository userGoalRepository;

    public List<DietLogDTO> getDailyDietRecords(Long userId, LocalDate date) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<MealLog> mealLogs = mealLogRepository.findByUserAndLogDateOrderByCreatedAtDesc(user, date);
        
        return mealLogs.stream()
            .map(this::convertToDietLogDTO)
            .collect(Collectors.toList());
    }

    public List<DietNutritionDTO> getNutritionGoals(Long userId, LocalDate date) {
        // 사용자별 목표 가져오기
        UserGoal userGoal = userGoalRepository.findByUserId(userId)
            .orElse(getDefaultUserGoal(userId));

        // 해당 날짜의 실제 섭취량 계산 (직접 엔티티 조회)
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<MealLog> dailyMealLogs = mealLogRepository.findByUserAndLogDateOrderByCreatedAtDesc(user, date);

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

        // 목표 대비 백분율 계산 (Integer -> double 변환)
        return List.of(
            new DietNutritionDTO("칼로리", 0.0, totalCalories, "kcal", 0.0),
            new DietNutritionDTO("탄수화물", userGoal.getDailyCarbsTarget().doubleValue(), totalCarbs, "g", 
                calculatePercentage(totalCarbs, userGoal.getDailyCarbsTarget().doubleValue())),
            new DietNutritionDTO("단백질", userGoal.getDailyProteinTarget().doubleValue(), totalProtein, "g", 
                calculatePercentage(totalProtein, userGoal.getDailyProteinTarget().doubleValue())),
            new DietNutritionDTO("지방", userGoal.getDailyFatTarget().doubleValue(), totalFat, "g", 
                calculatePercentage(totalFat, userGoal.getDailyFatTarget().doubleValue()))
        );
    }

    public Map<String, DietCalendarDTO> getCalendarRecords(Long userId, int year, int month) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        
        Map<String, DietCalendarDTO> calendarData = new HashMap<>();
        
        // 해당 월의 식단 기록 가져오기 (운동은 제외)
        List<MealLog> dietRecords = mealLogRepository.findByUserAndLogDateBetweenOrderByLogDateDesc(user, startDate, endDate);
        
        // 식단 기록 처리
        for (MealLog mealLog : dietRecords) {
            String dateStr = mealLog.getLogDate().toString();
            
            DietCalendarDTO dto = calendarData.getOrDefault(dateStr, new DietCalendarDTO());
            dto.setHasDiet(true);
            dto.setDietCount(dto.getDietCount() + 1);
            calendarData.put(dateStr, dto);
        }
        
        return calendarData;
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
    public DietLogDTO updateDietRecord(Long id, DietLogDTO request) {
        MealLog mealLog = mealLogRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Diet record not found"));
        
        FoodItem foodItem = foodItemRepository.findById(request.getFoodItemId())
            .orElseThrow(() -> new RuntimeException("Food item not found"));
        
        mealLog.setFoodItem(foodItem);
        mealLog.setQuantity(BigDecimal.valueOf(request.getQuantity()));
        
        MealLog updatedMealLog = mealLogRepository.save(mealLog);
        return convertToDietLogDTO(updatedMealLog);
    }

    @Transactional
    public void deleteDietRecord(Long id) {
        mealLogRepository.deleteById(id);
    }

    private UserGoal getDefaultUserGoal(Long userId) {
        UserGoal defaultGoal = new UserGoal();
        defaultGoal.setUuid(UUID.randomUUID());
        defaultGoal.setUserId(userId);
        defaultGoal.setWeeklyWorkoutTarget(3);
        defaultGoal.setDailyCarbsTarget(250);
        defaultGoal.setDailyProteinTarget(150);
        defaultGoal.setDailyFatTarget(67);
        defaultGoal.setCreatedAt(LocalDateTime.now());
        defaultGoal.setUpdatedAt(LocalDateTime.now());
        return defaultGoal;
    }

    private DietLogDTO convertToDietLogDTO(MealLog mealLog) {
        DietLogDTO dto = new DietLogDTO();
        dto.setId(mealLog.getMealLogId());
        dto.setUserId(mealLog.getUser().getUserId());
        dto.setFoodItemId(mealLog.getFoodItem().getFoodItemId());
        dto.setFoodName(mealLog.getFoodItem().getName());
        dto.setQuantity(mealLog.getQuantity().doubleValue());
        dto.setLogDate(mealLog.getLogDate().toString());
        dto.setUnit("g");
        
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

    private double calculatePercentage(double current, double target) {
        if (target == 0) return 0;
        return Math.min((current / target) * 100, 100);
    }
} 
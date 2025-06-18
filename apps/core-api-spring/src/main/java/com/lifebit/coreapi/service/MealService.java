package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.FoodItem;
import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.entity.MealTimeType;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.FoodItemRepository;
import com.lifebit.coreapi.repository.MealLogRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
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
        return mealLogRepository.findByUserAndLogDateBetweenOrderByLogDateDesc(
            user, startDate, endDate);
    }

    public List<FoodItem> searchFoodItems(String keyword) {
        return foodItemRepository.findByNameContainingIgnoreCase(keyword);
    }

    public FoodItem getFoodItemByCode(String foodCode) {
        return foodItemRepository.findByFoodCode(foodCode)
            .orElseThrow(() -> new EntityNotFoundException("Food item not found"));
    }
} 
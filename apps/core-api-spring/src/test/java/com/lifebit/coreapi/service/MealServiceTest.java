package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.FoodItem;
import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.repository.FoodItemRepository;
import com.lifebit.coreapi.repository.MealLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class MealServiceTest {

    @Mock
    private MealLogRepository mealLogRepository;

    @Mock
    private FoodItemRepository foodItemRepository;

    @InjectMocks
    private MealService mealService;

    @Test
    void recordMeal_ValidInput_ReturnsMealLog() {
        // Given
        Long userId = 1L;
        Long foodItemId = 1L;
        BigDecimal quantity = new BigDecimal("1.5");

        FoodItem foodItem = new FoodItem();
        foodItem.setFoodItemId(foodItemId);
        foodItem.setName("Apple");
        foodItem.setCalories(new BigDecimal("52"));

        MealLog mealLog = new MealLog();
        mealLog.setMealLogId(1L);
        mealLog.setFoodItem(foodItem);
        mealLog.setQuantity(quantity);

        when(foodItemRepository.findById(foodItemId)).thenReturn(Optional.of(foodItem));
        when(mealLogRepository.save(any(MealLog.class))).thenReturn(mealLog);

        // When
        MealLog result = mealService.recordMeal(userId, foodItemId, quantity);

        // Then
        assertNotNull(result);
        assertEquals(quantity, result.getQuantity());
        assertEquals(foodItem, result.getFoodItem());
    }
} 
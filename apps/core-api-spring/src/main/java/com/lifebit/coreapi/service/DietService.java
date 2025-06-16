package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.DietDTO;
import com.lifebit.coreapi.dto.DietNutritionDTO;
import com.lifebit.coreapi.entity.DietLog;
import com.lifebit.coreapi.entity.DietNutrition;
import com.lifebit.coreapi.repository.DietLogRepository;
import com.lifebit.coreapi.repository.DietNutritionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DietService {
    private final DietLogRepository mealLogRepository;
    private final DietNutritionRepository userGoalRepository;

    public List<DietDTO> getDailyMealLogs(Long userId, LocalDate date) {
        return mealLogRepository.findByUserIdAndLogDate(userId, date)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<DietNutritionDTO> getDailyNutritionGoals(Long userId, LocalDate date) {
        DietNutrition userGoal = userGoalRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("User goal not found"));

        Double currentCalories = mealLogRepository.sumCaloriesByUserIdAndDate(userId, date);
        Double currentCarbs = mealLogRepository.sumCarbsByUserIdAndDate(userId, date);
        Double currentProtein = mealLogRepository.sumProteinByUserIdAndDate(userId, date);
        Double currentFat = mealLogRepository.sumFatByUserIdAndDate(userId, date);

        return List.of(
            createNutritionGoal("칼로리", userGoal.getDailyCarbsTarget(), currentCalories.intValue(), "kcal"),
            createNutritionGoal("탄수화물", userGoal.getDailyCarbsTarget(), currentCarbs.intValue(), "g"),
            createNutritionGoal("단백질", userGoal.getDailyProteinTarget(), currentProtein.intValue(), "g"),
            createNutritionGoal("지방", userGoal.getDailyFatTarget(), currentFat.intValue(), "g")
        );
    }

    private DietDTO convertToDTO(DietLog mealLog) {
        DietDTO dto = new DietDTO();
        dto.setId(mealLog.getId());
        dto.setFoodName(mealLog.getFoodItem().getName());
        dto.setQuantity(mealLog.getQuantity());
        dto.setCalories(mealLog.getFoodItem().getCalories() * mealLog.getQuantity());
        dto.setCarbs(mealLog.getFoodItem().getCarbs() * mealLog.getQuantity());
        dto.setProtein(mealLog.getFoodItem().getProtein() * mealLog.getQuantity());
        dto.setFat(mealLog.getFoodItem().getFat() * mealLog.getQuantity());
        dto.setLogDate(mealLog.getLogDate());
        dto.setUnit("g");
        return dto;
    }

    private DietNutritionDTO createNutritionGoal(String name, Integer target, Integer current, String unit) {
        DietNutritionDTO dto = new DietNutritionDTO();
        dto.setName(name);
        dto.setTarget(target);
        dto.setCurrent(current);
        dto.setUnit(unit);
        dto.setPercentage(target > 0 ? (double) current / target * 100 : 0.0);
        return dto;
    }
} 